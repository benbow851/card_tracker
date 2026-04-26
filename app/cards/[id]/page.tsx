import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { PriceChartLazy as PriceChart } from "@/components/cards/PriceChartLazy";
import { CardSpecs } from "@/components/cards/CardSpecs";
import { GradedPriceTable } from "@/components/cards/GradedPriceTable";
import { prisma } from "@/lib/prisma";
import { getCardById, getGradedPrices, getPrice, getRelated } from "@/lib/queries";
import { formatPrice, formatPercent } from "@/lib/utils";
import type { Card, PriceData } from "@/types";

export const revalidate = 300; // 5 min ISR

/**
 * Pre-render the top 200 cards at build time (highest market price first).
 * Other card IDs are generated on-demand and cached after the first hit.
 */
export async function generateStaticParams() {
  const top = await prisma.card.findMany({
    where: { prices: { some: {} } },
    select: { id: true },
    orderBy: {
      prices: {
        _count: "desc",
      },
    },
    take: 200,
  });
  return top.map((c) => ({ id: c.id }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<import("next").Metadata> {
  const card = await getCardById(params.id);
  if (!card) return { title: "Card not found · The Digital Vault" };

  const title = `${card.name} (#${card.cardNumber}) · ${card.setName}`;
  const description =
    card.cardText ??
    card.description ??
    `${card.rarity} ${card.cardType ?? "card"} from ${card.setName}. Live market price tracking in THB.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const card = await getCardById(params.id);
  if (!card) return notFound();

  const [price, related, gradedPrices] = await Promise.all([
    getPrice(card.id),
    getRelated(card.id),
    getGradedPrices(card.id),
  ]);

  // JSON-LD Product schema for Google Rich Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: card.name,
    description:
      card.cardText ?? card.description ?? `${card.rarity} ${card.cardType ?? ""} from ${card.setName}`,
    sku: card.cardNumber,
    image: card.imageUrl,
    brand: { "@type": "Brand", name: card.series ?? card.category },
    category: card.category,
    ...(price && {
      offers: {
        "@type": "Offer",
        priceCurrency: "THB",
        price: price.current.toFixed(2),
        availability: "https://schema.org/InStock",
        priceValidUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      },
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Vault", item: "/cards" },
      {
        "@type": "ListItem",
        position: 2,
        name: card.series ?? card.category,
        item: `/cards?category=${card.category}`,
      },
      { "@type": "ListItem", position: 3, name: card.name },
    ],
  };

  return (
    <div className="pb-24 px-6 lg:px-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <section className="lg:col-span-12 mt-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-xs font-label uppercase tracking-widest mb-4">
          <Link href="/cards" className="hover:text-on-surface">
            Vault
          </Link>
          <Icon name="chevron_right" className="text-[10px]" />
          <Link
            href={`/cards?category=${card.category}`}
            className="hover:text-on-surface"
          >
            {card.series ?? card.category}
          </Link>
          <Icon name="chevron_right" className="text-[10px]" />
          <span className="text-primary">{card.rarity}</span>
        </div>
        <h1 className="text-4xl md:text-6xl xl:text-7xl font-headline font-bold tracking-tighter">
          {card.name} <span className="text-primary">#{card.cardNumber}</span>
        </h1>
        {card.description && card.description !== "NULL" && (
          <p className="text-on-surface-variant mt-3 font-body max-w-2xl">
            {card.description}
          </p>
        )}
      </section>

      <aside className="lg:col-span-5 xl:col-span-4">
        <div className="lg:sticky lg:top-28 space-y-6">
          <div className="relative group cursor-zoom-in overflow-hidden rounded-2xl bg-surface-container aspect-[3/4]">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
              <span className="text-xs font-label uppercase tracking-widest bg-primary/20 backdrop-blur-md px-3 py-1 rounded-full">
                {card.finish ?? "Holographic"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-4 rounded-xl transition-all hover:brightness-110 active:scale-95">
              <Icon name="account_balance_wallet" filled className="text-xl" />
              <span>Track Asset</span>
            </button>
            <button className="flex items-center justify-center gap-2 glass-panel text-on-surface font-bold py-4 rounded-xl transition-all hover:bg-white/10 active:scale-95">
              <Icon name="share" className="text-xl" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-7 xl:col-span-8 space-y-10">
        {price && <PriceDashboard price={price} />}
        {price && <ChartSection price={price} />}
        <GradedPriceTable prices={gradedPrices} />
        <CardSpecs card={card} />
        {price && <MarketSources price={price} />}
      </div>

      {related.length > 0 && (
        <RelatedCarousel related={related} setName={card.setName} />
      )}
    </div>
  );
}

function PriceDashboard({ price }: { price: PriceData | null }) {
  if (!price) return null;
  const positive = price.change24h >= 0;
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-primary shimmer-bg">
        <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant block mb-2">
          Market Floor
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl xl:text-4xl font-headline font-bold">
            {formatPrice(price.current)}
          </span>
          <span className="text-xs font-body text-primary">
            {price.currency}
          </span>
        </div>
      </div>
      <div
        className={
          "glass-panel p-6 rounded-2xl border-l-4 " +
          (positive ? "border-tertiary" : "border-error")
        }
      >
        <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant block mb-2">
          24h Change
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={
              "text-3xl xl:text-4xl font-headline font-bold " +
              (positive ? "text-tertiary" : "text-error")
            }
          >
            {positive ? "+" : ""}
            {formatPrice(price.change24h)}
          </span>
          <div
            className={
              "flex items-center px-2 py-0.5 rounded text-xs font-bold " +
              (positive
                ? "bg-tertiary/10 text-tertiary"
                : "bg-error/10 text-error")
            }
          >
            <Icon
              name={positive ? "trending_up" : "trending_down"}
              className="text-sm"
            />
            {formatPercent(price.changePercent24h)}
          </div>
        </div>
      </div>
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-secondary">
        <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant block mb-2">
          Weekly Trend
        </span>
        <div className="flex items-center gap-2">
          <span className="text-3xl xl:text-4xl font-headline font-bold text-secondary">
            {price.weeklyTrend}
          </span>
          <Icon name="monitoring" className="text-secondary animate-pulse" />
        </div>
      </div>
    </section>
  );
}

function ChartSection({ price }: { price: PriceData }) {
  return (
    <section className="glass-panel p-6 lg:p-8 rounded-2xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h3 className="text-xl font-headline font-bold flex items-center gap-3">
          <Icon name="show_chart" className="text-primary" />
          Price Performance
        </h3>
        <div className="flex bg-surface-container-highest p-1 rounded-lg">
          {["7D", "1M", "1Y", "ALL"].map((r, i) => (
            <button
              key={r}
              className={
                i === 1
                  ? "px-4 py-1.5 text-xs font-bold rounded-md bg-primary text-on-primary"
                  : "px-4 py-1.5 text-xs font-bold rounded-md text-on-surface-variant hover:text-on-surface"
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <PriceChart data={price.history} />
    </section>
  );
}

function MarketSources({ price }: { price: PriceData }) {
  return (
    <section className="space-y-6">
      <h3 className="text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
        <span className="w-8 h-px bg-outline-variant" />
        Live Market Aggregator · ราคากลางจากแหล่งต่างๆ
      </h3>
      <div className="space-y-1">
        {price.sources.map((s, i) => {
          const last = i === price.sources.length - 1;
          const first = i === 0;
          return (
            <div
              key={s.name}
              className={
                "flex items-center justify-between p-5 " +
                (s.highlight
                  ? "bg-surface-container"
                  : "bg-surface-container-low") +
                (first ? " rounded-t-xl" : "") +
                (last ? " rounded-b-xl" : "")
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={
                    "w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold " +
                    (s.short === "TCG"
                      ? "bg-primary/20 text-primary"
                      : s.short === "CM"
                      ? "bg-secondary/20 text-secondary"
                      : "bg-surface-bright text-on-surface")
                  }
                >
                  {s.short}
                </div>
                <div>
                  <div className="font-body font-medium">{s.name}</div>
                  <div className="text-[10px] text-on-surface-variant">
                    {s.note}
                  </div>
                </div>
              </div>
              <div
                className={
                  "font-headline font-bold text-lg " +
                  (s.highlight ? "text-primary" : "")
                }
              >
                {formatPrice(s.price)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RelatedCarousel({
  related,
  setName,
}: {
  related: Card[];
  setName: string;
}) {
  return (
    <section className="lg:col-span-12 space-y-8 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-headline font-bold">
          Related from <span className="text-primary">{setName}</span>
        </h3>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
            <Icon name="arrow_back" />
          </button>
          <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
            <Icon name="arrow_forward" />
          </button>
        </div>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
        {related.map((card) => (
          <Link
            key={card.id}
            href={`/cards/${card.id}`}
            className="min-w-[260px] snap-start glass-panel rounded-2xl p-4 space-y-4 hover:translate-y-[-4px] transition-transform"
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-container-high relative">
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="260px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex justify-between items-start">
                <h4 className="font-headline font-bold">{card.name}</h4>
                <span className="text-xs font-bold text-primary">
                  #{card.cardNumber}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                {card.rarity}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
