import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CardTile } from "@/components/cards/CardTile";
import { SERIES } from "@/lib/constants";
import { getTrending } from "@/lib/queries";
import type { TrendingCard } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const trending = await getTrending();
  return (
    <>
      <HeroSection />
      <SeriesIndexSection />
      <TrendingSection trending={trending} />
      <DataIntegritySection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[720px] flex items-center px-6 lg:px-24 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 overflow-hidden">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKJOyZmUSsMd8Nu0rxXQUqlY9z8YCD-btk6Co9synsyfJ6zvzFW2vw-2WW6OcrApSrd2kcqythRRa_9_1-Dqru24DaPkoxgpeg-NubYGPSziiZrFaEPh_VMaxPBRSV02JYOuglFPOPLKiz4OXPq2EPfjbXQbNbVsCwAoGuVQ90Nftpf9IXZ68tsBhjpu_s9kKB-VX9pzvDN8ZDQfFtC8rBDJbyhWahXD4tPEZb25Daminh8n40QCPFbA-RK-uuuHLfNgLLbMOL4JH3"
          alt=""
          fill
          priority
          className="object-cover grayscale opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
      </div>
      <div className="relative z-10 max-w-4xl py-24">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-body text-xs uppercase tracking-[0.2em] font-bold mb-6">
          Real-time Market Analytics
        </span>
        <h1 className="font-headline text-5xl md:text-7xl xl:text-8xl font-bold tracking-tighter leading-none mb-8">
          The Global <br />
          <span className="text-primary">TCG Authority.</span>
        </h1>
        <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
          Access deep liquidity data, historical trends, and real-time price
          tracking for over 10+ anime series in one unified digital vault.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <Link
            href="/cards"
            className="bg-primary text-on-primary px-8 py-4 lg:px-10 lg:py-5 rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            Initialize Search <Icon name="arrow_forward" />
          </Link>
          <Link
            href="/cards"
            className="glass-panel text-on-surface px-8 py-4 lg:px-10 lg:py-5 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            View Live Trends <Icon name="trending_up" />
          </Link>
        </div>
      </div>
      <FloatingIndexCard />
    </section>
  );
}

function FloatingIndexCard() {
  return (
    <div className="hidden xl:block absolute right-24 top-1/2 -translate-y-1/2 w-96 glass-panel rounded-2xl p-8 shimmer-bg shadow-glow-primary">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="block font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-1">
            Index Price
          </span>
          <h3 className="font-headline text-3xl font-bold">$142,508.20</h3>
        </div>
        <span className="bg-tertiary/20 text-tertiary px-2 py-1 rounded text-xs font-bold font-body">
          +12.4%
        </span>
      </div>
      <div className="h-32 flex items-end gap-1 mb-6">
        {[0.5, 0.75, 0.66, 0.83, 1].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-primary rounded-t-sm"
            style={{ height: `${h * 100}%`, opacity: 0.3 + h * 0.7 }}
          />
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-on-surface-variant">24h Vol</span>
          <span className="font-bold">$1.2M</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-on-surface-variant">Market Cap</span>
          <span className="font-bold">$42.8M</span>
        </div>
      </div>
    </div>
  );
}

function SeriesIndexSection() {
  const [hero, ...rest] = SERIES;
  return (
    <section className="py-20 lg:py-24 px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12 lg:mb-16">
        <div>
          <h2 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Series Index
          </h2>
          <p className="text-on-surface-variant text-sm lg:text-base">
            Top-tier anime franchises tracked by our editorial engine.
          </p>
        </div>
        <Link
          href="/cards"
          className="hidden sm:block text-primary hover:underline font-body text-sm uppercase tracking-widest font-bold"
        >
          See All 12 Series
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Link
          href={`/cards?category=${hero.category}`}
          className="md:col-span-8 relative rounded-2xl overflow-hidden group h-[400px] md:h-[460px]"
        >
          <Image
            src={hero.imageUrl}
            alt={hero.name}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 lg:p-10 w-full">
            {hero.badge && (
              <span className="bg-secondary px-3 py-1 rounded text-[10px] font-black text-on-secondary mb-4 inline-block uppercase tracking-wider">
                {hero.badge}
              </span>
            )}
            <h3 className="font-headline text-4xl lg:text-5xl font-bold mb-4">
              {hero.name}
            </h3>
            <p className="text-on-surface-variant max-w-md mb-6">
              {hero.description}
            </p>
            <div className="flex gap-8">
              <div>
                <span className="block text-xs text-on-surface-variant uppercase">
                  Sets Tracked
                </span>
                <span className="font-headline font-bold text-xl">
                  {String(hero.setsTracked).padStart(2, "0")}
                </span>
              </div>
              <div>
                <span className="block text-xs text-on-surface-variant uppercase">
                  Price Trend
                </span>
                <span className="font-headline font-bold text-xl text-tertiary">
                  +{hero.trend}%
                </span>
              </div>
            </div>
          </div>
        </Link>
        {rest[0] && (
          <Link
            href={`/cards?category=${rest[0].category}`}
            className="md:col-span-4 relative rounded-2xl overflow-hidden group h-[400px] md:h-[460px]"
          >
            <Image
              src={rest[0].imageUrl}
              alt={rest[0].name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 lg:p-10">
              <h3 className="font-headline text-3xl font-bold mb-2">
                {rest[0].name}
              </h3>
              <p className="text-on-surface-variant text-sm mb-6">
                {rest[0].description}
              </p>
              <span className="inline-block bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/20 transition-all">
                Explore Series
              </span>
            </div>
          </Link>
        )}
        {rest[1] && (
          <Link
            href={`/cards?category=${rest[1].category}`}
            className="md:col-span-12 relative rounded-2xl overflow-hidden group h-64"
          >
            <Image
              src={rest[1].imageUrl}
              alt={rest[1].name}
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/50 to-transparent" />
            <div className="absolute inset-y-0 left-0 p-8 lg:p-10 flex flex-col justify-center">
              <h3 className="font-headline text-3xl lg:text-4xl font-bold mb-2">
                {rest[1].name}
              </h3>
              <p className="text-on-surface-variant text-sm max-w-xs">
                {rest[1].description}
              </p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}

function TrendingSection({ trending }: { trending: TrendingCard[] }) {
  return (
    <section className="py-20 lg:py-24 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12 lg:mb-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
              <Icon name="trending_up" />
            </div>
            <h2 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight">
              Market Gainers
            </h2>
          </div>
          <div className="hidden sm:flex bg-surface-container rounded-xl p-1">
            <button className="px-6 py-2 rounded-lg bg-surface-bright text-primary text-xs font-bold">
              24H
            </button>
            <button className="px-6 py-2 rounded-lg text-on-surface-variant text-xs font-bold">
              7D
            </button>
            <button className="px-6 py-2 rounded-lg text-on-surface-variant text-xs font-bold">
              30D
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trending.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DataIntegritySection() {
  const stats = [
    { label: "Daily Updates", value: "100k+" },
    { label: "Data APIs", value: "12" },
    { label: "Price Accuracy", value: "99.9%" },
    { label: "Market Uptime", value: "24/7" },
  ];
  return (
    <section className="py-20 lg:py-24 px-6 lg:px-8 max-w-5xl mx-auto text-center">
      <div className="mb-12">
        <Icon name="account_balance" className="text-primary text-5xl mb-6" />
        <h2 className="font-headline text-3xl lg:text-4xl font-bold mb-6">
          Verified Data Integrity
        </h2>
        <p className="text-on-surface-variant text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
          Our pricing engine aggregates data from TCGPlayer, Cardmarket, eBay,
          and private auction houses every 60 seconds. We utilize proprietary
          AI to filter outliers and wash trades, providing the most accurate
          &ldquo;Fair Market Value&rdquo; in the industry.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
        {stats.map((s) => (
          <div key={s.label} className="p-6 bg-surface-container rounded-2xl">
            <span className="block font-headline text-3xl font-bold text-primary mb-1">
              {s.value}
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-body font-bold">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
