import type { Card } from "@/types";

const COLOR_CHIP: Record<string, string> = {
  Red: "bg-red-500/20 text-red-300",
  Blue: "bg-primary/20 text-primary",
  Green: "bg-tertiary/20 text-tertiary",
  Purple: "bg-secondary/20 text-secondary",
  Black: "bg-white/10 text-on-surface",
  Yellow: "bg-amber-500/20 text-amber-300",
};

function colorClasses(color?: string): string {
  if (!color) return "bg-surface-container-high text-on-surface-variant";
  return COLOR_CHIP[color] ?? "bg-surface-container-high text-on-surface-variant";
}

const ATTR_GLYPH: Record<string, string> = {
  Slash: "斬",
  Strike: "打",
  Ranged: "射",
  Special: "特",
  Wisdom: "知",
};

function clean(v?: string | number | null): string | number | undefined {
  if (v === null || v === undefined) return undefined;
  const s = typeof v === "string" ? v.trim() : v;
  if (typeof s === "string" && (s === "" || s.toUpperCase() === "NULL")) {
    return undefined;
  }
  return s;
}

export function CardSpecs({ card }: { card: Card }) {
  const cardColor = clean(card.cardColor) as string | undefined;
  const cardType = clean(card.cardType) as string | undefined;
  const attribute = clean(card.attribute) as string | undefined;

  // Order matters — most-used stats first
  const rows: { label: string; thai: string; value?: string | number }[] = [
    { label: "Card Type", thai: "ประเภท", value: clean(card.cardType) },
    { label: "Rarity", thai: "ความหายาก", value: clean(card.rarity) },
    { label: "Cost", thai: "ค่าใช้", value: clean(card.cardCost) },
    { label: "Power", thai: "พาวเวอร์", value: clean(card.cardPower) },
    { label: "Life", thai: "ไลฟ์", value: clean(card.life) },
    {
      label: "Counter",
      thai: "เคาน์เตอร์",
      value: card.counterAmount ? `+${card.counterAmount}` : undefined,
    },
    { label: "Set", thai: "ชุดการ์ด", value: clean(card.setName) },
    { label: "Year", thai: "ปี", value: card.year ?? undefined },
    { label: "Finish", thai: "พื้นผิว", value: clean(card.finish) },
    { label: "Language", thai: "ภาษา", value: clean(card.language) ?? "English" },
  ].filter((r) => r.value !== undefined);

  const subTypes = card.subTypes
    ?.split(/[/,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className="space-y-8">
      {/* Hero stat strip — Color, Attribute, Type */}
      {(cardColor || attribute || cardType) && (
        <div className="flex flex-wrap items-center gap-3">
          {cardColor && (
            <span
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${colorClasses(cardColor)}`}
            >
              <span className="opacity-60 mr-2">●</span>
              {cardColor}
            </span>
          )}
          {attribute && (
            <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-surface-container-high text-on-surface flex items-center gap-2">
              {ATTR_GLYPH[attribute] && (
                <span className="text-base font-headline text-primary">
                  {ATTR_GLYPH[attribute]}
                </span>
              )}
              {attribute}
            </span>
          )}
          {cardType && (
            <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-surface-container-high text-on-surface-variant">
              {cardType}
            </span>
          )}
        </div>
      )}

      {/* Spec grid */}
      <div className="space-y-6">
        <h3 className="text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
          <span className="w-8 h-px bg-outline-variant" />
          Card Specifications · คุณสมบัติของการ์ด
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-outline-variant/20 rounded-xl overflow-hidden">
          {rows.map((row) => (
            <div key={row.label} className="p-4 bg-surface-container-low">
              <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant block mb-1">
                {row.thai} <span className="opacity-60">· {row.label}</span>
              </span>
              <span className="font-headline font-bold text-on-surface">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-types chips */}
      {subTypes && subTypes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
            <span className="w-8 h-px bg-outline-variant" />
            Sub-types · คุณสมบัติย่อย
          </h3>
          <div className="flex flex-wrap gap-2">
            {subTypes.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high text-on-surface-variant"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ability / Effect text */}
      {card.cardText && (
        <div className="space-y-3">
          <h3 className="text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
            <span className="w-8 h-px bg-outline-variant" />
            Ability · ความสามารถ
          </h3>
          <div className="glass-panel rounded-2xl p-6">
            <p className="font-body text-on-surface leading-relaxed whitespace-pre-line">
              {formatAbilityText(card.cardText)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Parse OPTCG-style ability text and highlight bracketed keywords.
 * e.g. "[On Play]" → primary-colored chip
 */
function formatAbilityText(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return (
        <span
          key={i}
          className="inline-block bg-primary/15 text-primary px-2 py-0.5 rounded font-bold text-sm mr-1"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
