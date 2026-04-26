import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils";

export function TrendBadge({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "text-xs font-bold rounded px-2 py-0.5 font-body",
        positive
          ? "bg-tertiary/15 text-tertiary"
          : "bg-error/15 text-error",
        className
      )}
    >
      {formatPercent(value)}
    </span>
  );
}
