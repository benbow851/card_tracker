import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low/90 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-20 px-4 z-40">
      <Link
        href="/"
        className="flex flex-col items-center gap-1 text-primary"
      >
        <Icon name="account_balance" filled />
        <span className="text-[10px] font-label uppercase">Vault</span>
      </Link>
      <Link
        href="/cards"
        className="flex flex-col items-center gap-1 text-on-surface-variant"
      >
        <Icon name="grid_view" />
        <span className="text-[10px] font-label uppercase">Index</span>
      </Link>
      <button className="flex flex-col items-center gap-1 text-on-surface-variant">
        <Icon name="show_chart" />
        <span className="text-[10px] font-label uppercase">Ticker</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-on-surface-variant">
        <Icon name="notifications_active" />
        <span className="text-[10px] font-label uppercase">Alerts</span>
      </button>
    </nav>
  );
}
