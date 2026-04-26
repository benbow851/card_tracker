import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { getCharacterCards } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const view = await getCharacterCards(params.slug);
  if (!view) return { title: "Character not found" };
  return {
    title: `${view.name} · One Piece TCG · The Digital Vault`,
    description: `All ${view.totalCards} ${view.name} cards across One Piece TCG sets — live prices in THB + JPY. ดูการ์ด ${view.name} ทุกใบทุก set พร้อมราคาเปรียบเทียบ.`,
  };
}

export default async function CharacterPage({
  params,
}: {
  params: { slug: string };
}) {
  const view = await getCharacterCards(params.slug);
  if (!view) return notFound();

  const sortedSets = Array.from(view.cardsBySet.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  // Highest-price card per character — use as hero image
  const allCards = Array.from(view.cardsBySet.values()).flat();
  const hero = allCards
    .filter((c) => c.priceTHB > 0)
    .sort((a, b) => b.priceTHB - a.priceTHB)[0];

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-12 pb-20 space-y-12">
      {/* Hero header */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-on-surface-variant text-xs font-label uppercase tracking-widest">
          <Link href="/" className="hover:text-on-surface">
            Vault
          </Link>
          <Icon name="chevron_right" className="text-[10px]" />
          <Link href="/characters" className="hover:text-on-surface">
            Characters
          </Link>
          <Icon name="chevron_right" className="text-[10px]" />
          <span className="text-primary">{view.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-end">
          <div className="md:col-span-3 lg:col-span-2">
            {hero?.imageUrl && (
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container">
                <Image
                  src={hero.imageUrl}
                  alt={view.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  priority
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <div className="md:col-span-9 lg:col-span-10 space-y-3">
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter">
              {view.name}
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl">
              {view.totalCards} cards across {sortedSets.length} sets · ดูการ์ด
              ทุกใบของตัวละครนี้ พร้อมราคา JPY + THB
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/cards?search=${encodeURIComponent(view.name)}`}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-surface-container-high text-on-surface-variant hover:text-primary"
              >
                <Icon name="filter_list" className="text-sm mr-2" />
                Filter Browse view
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Cards grouped by set */}
      {sortedSets.map(([setCode, cards]) => (
        <section key={setCode} className="space-y-5">
          <div className="flex items-end justify-between border-b border-white/5 pb-3">
            <div>
              <Link
                href={`/sets/${setCode}`}
                className="font-headline text-2xl md:text-3xl font-bold tracking-widest uppercase hover:text-primary"
              >
                {setCode}
              </Link>
              <p className="text-xs text-on-surface-variant mt-1">
                {cards[0]?.setName} · {cards.length} card
                {cards.length === 1 ? "" : "s"}
              </p>
            </div>
            <Link
              href={`/sets/${setCode}`}
              className="text-primary text-xs font-bold uppercase tracking-widest"
            >
              See full set →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cards.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="block group rounded-2xl overflow-hidden bg-surface-container hover:bg-surface-container-high transition-all"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-high">
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {card.rarity && (
                    <span className="absolute top-2 left-2 bg-surface-container-lowest/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                      {card.rarity}
                    </span>
                  )}
                </div>
                <div className="p-3 md:p-4 space-y-2">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block">
                    {card.cardNumber}
                  </span>
                  <h3 className="font-headline font-bold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5em]">
                    {card.name}
                  </h3>
                  <div className="flex items-end justify-between pt-2 border-t border-white/5">
                    <div className="flex flex-col">
                      {card.priceJPY > 0 && (
                        <span className="text-amber-300 font-headline font-bold text-xs">
                          {formatPrice(card.priceJPY, "JPY")}
                        </span>
                      )}
                      <span className="font-headline font-bold text-base text-primary">
                        {card.priceTHB > 0 ? formatPrice(card.priceTHB) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
