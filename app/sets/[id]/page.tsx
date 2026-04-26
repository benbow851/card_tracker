import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { getSetGroupedByRarity } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const revalidate = 300;

const RARITY_ACCENT: Record<string, string> = {
  "P-SEC": "text-error",
  SEC: "text-error",
  "P-SR": "text-secondary",
  SR: "text-secondary",
  "P-L": "text-amber-300",
  L: "text-amber-300",
  "P-R": "text-tertiary",
  R: "text-tertiary",
  "P-UC": "text-primary",
  UC: "text-primary",
  "P-C": "text-on-surface",
  C: "text-on-surface",
  SP: "text-secondary",
  "P-P": "text-secondary",
  P: "text-on-surface-variant",
  "Holo Rare": "text-amber-300",
  "Ultra Rare": "text-secondary",
  Rare: "text-tertiary",
  Uncommon: "text-primary",
  Common: "text-on-surface-variant",
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const view = await getSetGroupedByRarity(params.id);
  if (!view) return { title: "Set not found" };
  return {
    title: `${view.setName} (${view.setId}) · Set Index · The Digital Vault`,
    description: `Browse all ${view.totalCards} cards in ${view.setName} grouped by rarity, with live prices in THB and JPY.`,
  };
}

export default async function SetPage({
  params,
}: {
  params: { id: string };
}) {
  const view = await getSetGroupedByRarity(params.id);
  if (!view) return notFound();

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-12 pb-20 space-y-10">
      {/* Breadcrumb + heading */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-on-surface-variant text-xs font-label uppercase tracking-widest">
          <Link href="/" className="hover:text-on-surface">
            Vault
          </Link>
          <Icon name="chevron_right" className="text-[10px]" />
          <Link
            href={`/cards?category=${view.category}`}
            className="hover:text-on-surface"
          >
            {view.category}
          </Link>
          <Icon name="chevron_right" className="text-[10px]" />
          <span className="text-primary">{view.setId}</span>
        </div>
        <div>
          <span className="block font-headline font-bold text-error text-2xl mb-2">
            {view.setId}
          </span>
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter uppercase">
            {view.setName}
          </h1>
          <p className="text-on-surface-variant mt-3">
            {view.totalCards} cards · {view.byRarity.length} rarity tiers ·
            ราคาตาม{" "}
            {view.category === "one-piece" ? "TCGPlayer (US)" : "Cardmarket (EU)"}{" "}
            แปลงเป็น THB + JPY
          </p>
        </div>
      </header>

      {/* Rarity quick-nav (chips) */}
      <nav className="glass-panel rounded-2xl p-4 flex flex-wrap items-center gap-2 sticky top-24 z-30">
        <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant pr-2">
          Rarity
        </span>
        {view.byRarity.map((g) => (
          <a
            key={g.rarity}
            href={`#rarity-${slug(g.rarity)}`}
            className={
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-surface-container-high hover:bg-primary/15 hover:text-primary " +
              (RARITY_ACCENT[g.rarity] ?? "text-on-surface-variant")
            }
          >
            {g.rarity}
            <span className="ml-2 opacity-60 font-normal">
              {g.cards.length}
            </span>
          </a>
        ))}
      </nav>

      {/* Groups */}
      {view.byRarity.map((group) => (
        <section
          key={group.rarity}
          id={`rarity-${slug(group.rarity)}`}
          className="space-y-6 scroll-mt-32"
        >
          <div className="flex items-end gap-4 border-b border-white/5 pb-3">
            <h2
              className={
                "font-headline text-2xl md:text-3xl font-bold tracking-widest uppercase " +
                (RARITY_ACCENT[group.rarity] ?? "text-on-surface")
              }
            >
              {group.rarity}
            </h2>
            <span className="text-xs text-on-surface-variant pb-1">
              {group.cards.length} card{group.cards.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {group.cards.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="block bg-surface-container hover:bg-surface-container-high rounded-2xl overflow-hidden group transition-all"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-high">
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                      {card.cardNumber}
                    </span>
                    <h3 className="font-headline font-bold text-base group-hover:text-primary transition-colors line-clamp-2">
                      {card.name}
                    </h3>
                  </div>
                  <span
                    className={
                      "inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border " +
                      (RARITY_ACCENT[group.rarity] ?? "text-on-surface-variant") +
                      " border-current/30"
                    }
                  >
                    {group.rarity}
                  </span>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <div className="flex flex-col">
                      <span className="text-amber-300 font-headline font-bold text-base">
                        {card.priceJPY > 0
                          ? formatPrice(card.priceJPY, "JPY")
                          : "—"}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        approx. JPY
                      </span>
                    </div>
                    <span className="text-primary font-headline font-bold text-lg">
                      {card.priceTHB > 0 ? formatPrice(card.priceTHB) : "—"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Footer note */}
      <div className="glass-panel rounded-2xl p-6 text-sm text-on-surface-variant">
        <p className="mb-2">
          <strong className="text-on-surface">หมายเหตุ ·  Notes:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            ราคา raw NM (Near Mint) ที่ไม่ได้ grade · Raw NM ungraded only
          </li>
          <li>
            One Piece อิงตามราคา TCGPlayer (US) · Pokémon อิงตามราคา Cardmarket
            (EU)
          </li>
          <li>
            JPY คำนวณจาก source × FX rate (อาจไม่ตรงราคาร้านญี่ปุ่นจริง) ·
            Computed from FX, not Japanese retail
          </li>
          <li>
            ราคา PSA10/CGC/BGS graded จะเพิ่มภายหลัง · Graded prices coming soon
          </li>
        </ul>
      </div>
    </div>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "-");
}
