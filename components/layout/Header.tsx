import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const NAV = [
  { label: "One Piece", href: "/cards?category=one-piece" },
  { label: "Characters", href: "/characters" },
  { label: "Pokémon", href: "/cards?category=pokemon" },
  { label: "Yu-Gi-Oh!", href: "/cards?category=yu-gi-oh" },
  { label: "Magic", href: "/cards?category=magic" },
];

export function Header() {
  return (
    <header className="fixed top-0 w-full flex items-center justify-between px-6 lg:px-8 py-4 h-20 bg-surface z-50">
      <div className="flex items-center gap-8 lg:gap-12">
        <Link
          href="/"
          className="text-xl lg:text-2xl font-bold tracking-tighter text-primary font-headline"
        >
          The Digital Vault
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                i === 0
                  ? "border-b-2 border-primary pb-1 font-label uppercase tracking-wider text-xs"
                  : "text-on-surface-variant hover:text-on-surface transition-colors font-label uppercase tracking-wider text-xs"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <form action="/cards" method="get" className="relative hidden sm:block">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none z-10"
            style={{ fontSize: "18px" }}
          />
          <input
            type="search"
            name="search"
            className="bg-surface-container-highest border-none rounded-xl pl-10 pr-4 py-2 text-sm w-56 lg:w-64 focus:ring-1 focus:ring-primary focus:outline-none transition-all"
            placeholder="Search the vault..."
          />
        </form>
        <button className="p-2 hover:bg-white/5 rounded-full transition-all text-on-surface-variant">
          <Icon name="notifications" />
        </button>
        <button className="p-2 hover:bg-white/5 rounded-full transition-all text-on-surface-variant">
          <Icon name="account_circle" />
        </button>
      </div>
    </header>
  );
}
