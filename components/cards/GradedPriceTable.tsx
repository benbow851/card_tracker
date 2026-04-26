import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/lib/utils";
import type { GradedPrice } from "@/lib/queries";

const GRADE_LABEL: Record<string, { label: string; thai: string; tone: string }> =
  {
    raw: { label: "Raw / NM", thai: "ดิบ ไม่ผ่านเกรด", tone: "text-on-surface" },
    "P-SEC": { label: "Parallel SEC", thai: "พาราเลล SEC", tone: "text-error" },
    "P-SR": { label: "Parallel SR", thai: "พาราเลล SR", tone: "text-secondary" },
    "P-L": { label: "Parallel Leader", thai: "พาราเลล Leader", tone: "text-amber-300" },
    "P-R": { label: "Parallel R", thai: "พาราเลล R", tone: "text-tertiary" },
    "P-UC": { label: "Parallel UC", thai: "พาราเลล UC", tone: "text-primary" },
    "P-C": { label: "Parallel C", thai: "พาราเลล C", tone: "text-on-surface" },
    PSA7: { label: "PSA 7", thai: "PSA 7", tone: "text-on-surface-variant" },
    PSA8: { label: "PSA 8", thai: "PSA 8", tone: "text-tertiary" },
    PSA9: { label: "PSA 9", thai: "PSA 9", tone: "text-primary" },
    "PSA9.5": { label: "PSA 9.5", thai: "PSA 9.5", tone: "text-primary" },
    PSA10: { label: "PSA 10", thai: "PSA 10", tone: "text-amber-300" },
    BGS10: { label: "BGS 10", thai: "BGS 10 Pristine", tone: "text-amber-300" },
    CGC10: { label: "CGC 10", thai: "CGC 10", tone: "text-secondary" },
  };

const GRADE_ORDER = [
  "raw",
  "P-C", "P-UC", "P-R", "P-SR", "P-L", "P-SEC",
  "PSA7", "PSA8", "PSA9", "PSA9.5", "PSA10",
  "BGS10", "CGC10",
];

const SOURCE_LABEL: Record<string, string> = {
  optcgapi: "TCGPlayer (OPTCG)",
  tcgdex: "Cardmarket (TCGdex)",
  pricecharting: "PriceCharting",
  ebay: "eBay sold",
  yuyutei: "Yuyu-Tei (遊々亭) JP",
};

const VARIANT_LABEL: Record<string, { label: string; thai: string }> = {
  base: { label: "Standard", thai: "มาตรฐาน" },
  parallel: { label: "Parallel", thai: "พาราเลล" },
  "super-parallel": { label: "Super Parallel", thai: "ซุปเปอร์พาราเลล" },
  "super-parallel-no-stamp": {
    label: "Super Parallel (No-stamp)",
    thai: "ซุปเปอร์พาราเลล (ไม่มี stamp)",
  },
  manga: { label: "Manga Art", thai: "ลายมังงะ" },
  "alt-art": { label: "Alternate Art", thai: "ภาพอีกแบบ" },
  "no-stamp": { label: "Collector (No-stamp)", thai: "ไม่มี stamp" },
  secret: { label: "Secret", thai: "ซีเครต" },
  "box-topper": { label: "Box Topper", thai: "แถมในกล่อง" },
  "box-bonus": { label: "Box Bonus", thai: "โบนัสกล่อง" },
  promo: { label: "Promo", thai: "โปรโม" },
};

function variantLabel(variant: string): { label: string; thai: string } {
  if (VARIANT_LABEL[variant]) return VARIANT_LABEL[variant];
  // Multi-variant joined by dash — humanize each part
  if (variant.includes("-")) {
    const parts = variant.split("-").map((p) => VARIANT_LABEL[p]?.label ?? p);
    return { label: parts.join(" + "), thai: parts.join(" + ") };
  }
  return { label: variant, thai: variant };
}

export function GradedPriceTable({ prices }: { prices: GradedPrice[] }) {
  // Has any graded data (not just raw)?
  const hasGraded = prices.some((p) => p.grade !== "raw");

  if (prices.length === 0) {
    return <ComingSoon />;
  }

  // Group by grade+variant tuple, sources within
  const byKey = new Map<string, GradedPrice[]>();
  for (const p of prices) {
    const key = `${p.grade}::${p.variant}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(p);
  }
  const sortedKeys = Array.from(byKey.keys()).sort((a, b) => {
    const [ga] = a.split("::");
    const [gb] = b.split("::");
    const gradeDiff = GRADE_ORDER.indexOf(ga) - GRADE_ORDER.indexOf(gb);
    if (gradeDiff !== 0) return gradeDiff;
    // Within same grade, sort variants by typical-rarity (base first, super-parallel last)
    const aVar = a.split("::")[1];
    const bVar = b.split("::")[1];
    const VARIANT_ORDER = ["base", "parallel", "super-parallel", "manga", "alt-art"];
    const aIdx = VARIANT_ORDER.findIndex((v) => aVar.includes(v));
    const bIdx = VARIANT_ORDER.findIndex((v) => bVar.includes(v));
    return aIdx - bIdx;
  });

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
          <span className="w-8 h-px bg-outline-variant" />
          Graded Prices · ราคาแยกตามเกรด + เวอร์ชั่นพิมพ์
        </h3>
        {!hasGraded && (
          <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">
            Graded data coming soon
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedKeys.map((key) => {
          const [grade, variant] = key.split("::");
          const meta = GRADE_LABEL[grade] ?? {
            label: grade,
            thai: grade,
            tone: "text-on-surface",
          };
          const variantMeta = variantLabel(variant);
          const tiers = byKey.get(key)!;
          const best = tiers.reduce((a, b) =>
            a.priceTHB > b.priceTHB ? a : b
          );
          return (
            <div
              key={key}
              className="glass-panel rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span
                    className={`font-headline font-bold text-lg ${meta.tone}`}
                  >
                    {meta.label}
                  </span>
                  {variant !== "base" && (
                    <span className="text-[10px] uppercase tracking-widest text-secondary font-bold mt-0.5">
                      {variantMeta.label}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-right">
                  {meta.thai}
                  {variant !== "base" && (
                    <span className="block text-secondary mt-0.5">
                      {variantMeta.thai}
                    </span>
                  )}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline font-bold text-2xl text-primary">
                    {formatPrice(best.priceTHB)}
                  </span>
                  {best.priceJPY > 0 && (
                    <span className="text-amber-300 text-xs">
                      ≈ {formatPrice(best.priceJPY, "JPY")}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-on-surface-variant mt-1">
                  {SOURCE_LABEL[best.source] ?? best.source} · source ${
                    best.sourcePrice.toFixed(2)
                  } {best.sourceCurrency}
                </div>
              </div>
              {tiers.length > 1 && (
                <details className="text-xs text-on-surface-variant">
                  <summary className="cursor-pointer hover:text-primary">
                    +{tiers.length - 1} more source(s)
                  </summary>
                  <ul className="mt-2 space-y-1 pl-2">
                    {tiers
                      .filter((t) => t.source !== best.source)
                      .map((t) => (
                        <li key={t.source} className="flex justify-between">
                          <span>{SOURCE_LABEL[t.source] ?? t.source}</span>
                          <span className="font-bold text-on-surface">
                            {formatPrice(t.priceTHB)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {!hasGraded && (
        <ComingSoonNote />
      )}
    </section>
  );
}

function ComingSoon() {
  return (
    <section className="space-y-6">
      <h3 className="text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
        <span className="w-8 h-px bg-outline-variant" />
        Graded Prices · ราคาแยกตามเกรด
      </h3>
      <ComingSoonNote />
    </section>
  );
}

function ComingSoonNote() {
  return (
    <div className="glass-panel rounded-2xl p-6 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-amber-300/15 text-amber-300 flex items-center justify-center shrink-0">
        <Icon name="hourglass_top" />
      </div>
      <div className="text-sm text-on-surface-variant space-y-2">
        <p className="text-on-surface font-bold">
          ราคาตามเกรด PSA / BGS / CGC กำลังเตรียมการ
        </p>
        <p>
          เรากำลัง integrate กับ PriceCharting เพื่อให้ครอบคลุม raw + PSA 7-10
          + BGS 10 + CGC 10 พร้อมใช้งานเร็วๆ นี้
        </p>
        <p className="text-xs">
          We&apos;re wiring up PriceCharting for graded price tiers (raw, PSA
          7-10, BGS 10, CGC 10). Coming soon.
        </p>
      </div>
    </div>
  );
}
