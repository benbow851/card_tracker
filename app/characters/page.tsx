import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getAllCharacters } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const revalidate = 600; // 10 min

export const metadata = {
  title: "One Piece Characters · The Digital Vault",
  description:
    "เลือกตัวละครจาก One Piece TCG เพื่อดูราคาการ์ดของตัวละครนั้นทุกชุด · Browse all One Piece TCG cards by character.",
};

export default async function CharactersPage() {
  const chars = await getAllCharacters();

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-12 pb-20 space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-on-surface-variant text-xs font-label uppercase tracking-widest">
          <Link href="/" className="hover:text-on-surface">
            Vault
          </Link>
          <Icon name="chevron_right" className="text-[10px]" />
          <span className="text-primary">Characters</span>
        </div>
        <div>
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter">
            One Piece <span className="text-primary">Characters</span>
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl">
            {chars.length} ตัวละครหลัก · เลือกตัวละครเพื่อดูการ์ดทุกใบ ทุก set
            พร้อมราคาเปรียบเทียบ JPY/THB
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {chars.map((char) => (
          <Link
            key={char.slug}
            href={`/characters/${char.slug}`}
            className="block group rounded-2xl overflow-hidden bg-surface-container hover:bg-surface-container-high transition-all"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-high">
              {char.thumbnailUrl ? (
                <Image
                  src={char.thumbnailUrl}
                  alt={char.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  <Icon name="account_circle" className="text-6xl" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-transparent p-3">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                  {char.cardCount} cards
                </span>
              </div>
            </div>
            <div className="p-3 md:p-4 space-y-2">
              <h3 className="font-headline font-bold text-sm md:text-base line-clamp-1 group-hover:text-primary transition-colors">
                {char.name}
              </h3>
              <div className="flex items-end justify-between pt-2 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-widest">
                    Top price
                  </span>
                  <span className="font-headline font-bold text-base text-primary">
                    {char.maxPriceTHB > 0
                      ? formatPrice(char.maxPriceTHB)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
