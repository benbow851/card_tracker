import { getTrending } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

export async function Ticker() {
  let items: { name: string; change: string; positive: boolean }[];

  try {
    const trending = await getTrending();
    if (trending.length === 0) {
      items = FALLBACK;
    } else {
      items = trending.map((c) => ({
        name: `${c.cardNumber} • ${c.name}`,
        change: formatPrice(c.price),
        positive: c.changePercent >= 0,
      }));
    }
  } catch {
    items = FALLBACK;
  }

  // Duplicate for seamless infinite scroll
  const doubled = [...items, ...items, ...items, ...items];

  return (
    <section className="bg-surface-container-low py-2 overflow-hidden border-y border-white/5">
      <div className="flex items-center gap-12 whitespace-nowrap px-4 animate-ticker w-fit">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-headline font-bold text-xs uppercase tracking-widest text-primary">
            Live Ticker
          </span>
        </div>
        <div className="flex gap-8 items-center text-xs font-body shrink-0">
          {doubled.map((item, i) => (
            <span key={i} className="text-on-surface-variant">
              {item.name}{" "}
              <span className={item.positive ? "text-tertiary" : "text-error"}>
                {item.change}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const FALLBACK = [
  { name: "Indexing data sources…", change: "", positive: true },
];
