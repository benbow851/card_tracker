import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { FilterBar } from "@/components/cards/FilterBar";
import { Pagination } from "@/components/cards/Pagination";
import { browseCards } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

const CATEGORY_LABEL: Record<string, string> = {
  "one-piece": "One Piece",
  naruto: "Naruto",
  pokemon: "Pokémon",
  "yu-gi-oh": "Yu-Gi-Oh!",
  magic: "Magic",
  "dragon-ball": "Dragon Ball",
};

interface BrowseSearchParams {
  category?: string;
  color?: string;
  type?: string;
  rarity?: string;
  search?: string;
  page?: string;
}

export default async function CardsBrowsePage({
  searchParams,
}: {
  searchParams: BrowseSearchParams;
}) {
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const { cards, total, totalPages } = await browseCards({
    category: searchParams.category,
    color: searchParams.color,
    type: searchParams.type,
    rarity: searchParams.rarity,
    search: searchParams.search,
    page,
    pageSize: 60,
  });

  const heading = searchParams.category
    ? CATEGORY_LABEL[searchParams.category] ?? "Index"
    : "All Series";

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-12 pb-20 space-y-8">
      {/* Breadcrumb + heading */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-on-surface-variant text-xs font-label uppercase tracking-widest">
          <Link href="/" className="hover:text-on-surface">
            Vault
          </Link>
          <Icon name="chevron_right" className="text-[10px]" />
          <span className="text-primary">{heading}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">
              {heading} <span className="text-primary">Index</span>
            </h1>
            <p className="text-on-surface-variant mt-2">
              {total.toLocaleString()} card{total === 1 ? "" : "s"} ·{" "}
              {searchParams.search ? `Results for "${searchParams.search}"` : "Live aggregator pulling 24/7"}
            </p>
          </div>
          <CategoryQuickNav active={searchParams.category} />
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar />

      {/* Editorial pick strip */}
      <TrendingStrip />

      {/* Card grid */}
      {cards.length === 0 ? (
        <EmptyState />
      ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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
                  {card.cardNumber} · {card.setCode}
                </span>
                <h3 className="font-headline font-bold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5em]">
                  {card.name}
                </h3>
                <div className="flex items-end justify-between pt-2 border-t border-white/5">
                  <div className="flex flex-col">
                    {card.priceJPY > 0 && (
                      <span className="text-amber-300 font-headline font-bold text-xs md:text-sm">
                        {formatPrice(card.priceJPY, "JPY")}
                      </span>
                    )}
                    <span className="font-headline font-bold text-base md:text-lg text-primary">
                      {card.priceTHB > 0 ? formatPrice(card.priceTHB) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          searchParams={searchParams as Record<string, string | undefined>}
        />
        </>
      )}
    </div>
  );
}

function CategoryQuickNav({ active }: { active?: string }) {
  const items = Object.entries(CATEGORY_LABEL);
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/cards"
        className={
          !active
            ? "px-4 py-2 rounded-full text-xs font-bold bg-primary text-on-primary"
            : "px-4 py-2 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant hover:text-on-surface"
        }
      >
        All
      </Link>
      {items.map(([key, label]) => (
        <Link
          key={key}
          href={`/cards?category=${key}`}
          className={
            active === key
              ? "px-4 py-2 rounded-full text-xs font-bold bg-primary text-on-primary"
              : "px-4 py-2 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          }
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

function TrendingStrip() {
  return (
    <div className="glass-panel rounded-2xl p-6 flex items-center justify-between gap-6 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
          <Icon name="auto_awesome" />
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant">
            Editorial Pick · บทความเด่น
          </span>
          <span className="font-headline font-bold text-base">
            One Piece OP-09 Emperors of the New World now indexing
          </span>
        </div>
      </div>
      <span className="text-primary text-xs font-bold uppercase tracking-widest">
        Live Update →
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-panel rounded-2xl p-16 text-center">
      <Icon
        name="search_off"
        className="text-on-surface-variant text-5xl mb-4"
      />
      <h3 className="font-headline text-2xl font-bold mb-2">
        No cards matched your filters
      </h3>
      <p className="text-on-surface-variant mb-6">
        ไม่พบการ์ดที่ตรงกับเงื่อนไข ลองปรับตัวกรองอีกครั้ง
      </p>
      <Link
        href="/cards"
        className="inline-block bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm"
      >
        Reset filters
      </Link>
    </div>
  );
}
