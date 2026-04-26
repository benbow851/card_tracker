import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TrendBadge } from "@/components/ui/TrendBadge";
import { formatPrice } from "@/lib/utils";
import type { TrendingCard } from "@/types";

export function CardTile({ card }: { card: TrendingCard }) {
  return (
    <Link
      href={`/cards/${card.id}`}
      className="block bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-all group"
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-6 bg-surface-container-high">
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
        <div className="absolute top-3 right-3 bg-surface-container-lowest/80 backdrop-blur-md p-2 rounded-lg">
          <Icon name="bolt" className="text-tertiary text-sm" />
        </div>
      </div>
      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2 font-body">
        {card.series ?? card.category} • {card.setCode}
      </span>
      <h4 className="font-headline font-bold text-lg mb-4 group-hover:text-primary transition-colors line-clamp-2">
        {card.name}
      </h4>
      <div className="flex justify-between items-end border-t border-white/5 pt-4">
        <div>
          <span className="block text-[10px] text-on-surface-variant font-body uppercase">
            Current Price
          </span>
          <span className="font-headline font-bold text-xl">
            {formatPrice(card.price)}
          </span>
        </div>
        <TrendBadge value={card.changePercent} />
      </div>
    </Link>
  );
}
