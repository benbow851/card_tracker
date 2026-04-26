import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface Props {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

function buildHref(
  searchParams: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v && k !== "page") params.set(k, v);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/cards?${qs}` : "/cards";
}

export function Pagination({ page, totalPages, searchParams }: Props) {
  if (totalPages <= 1) return null;

  // Build a windowed range: 1, …, p-1, p, p+1, …, last
  const window: (number | "...")[] = [];
  const push = (v: number | "...") => {
    if (window[window.length - 1] !== v) window.push(v);
  };
  push(1);
  if (page > 3) push("...");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    push(i);
  }
  if (page < totalPages - 2) push("...");
  if (totalPages > 1) push(totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 pt-8"
    >
      {page > 1 && (
        <Link
          href={buildHref(searchParams, page - 1)}
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center hover:bg-primary/15 hover:text-primary transition-all"
          aria-label="Previous page"
        >
          <Icon name="chevron_left" />
        </Link>
      )}
      {window.map((p, i) =>
        p === "..." ? (
          <span
            key={`gap-${i}`}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(searchParams, p)}
            className={
              p === page
                ? "w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold"
                : "w-10 h-10 rounded-xl glass-panel flex items-center justify-center hover:text-primary transition-all font-bold"
            }
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link
          href={buildHref(searchParams, page + 1)}
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center hover:bg-primary/15 hover:text-primary transition-all"
          aria-label="Next page"
        >
          <Icon name="chevron_right" />
        </Link>
      )}
    </nav>
  );
}
