import { cn } from "@/lib/utils";

export function Icon({
  name,
  className,
  filled,
  style,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : undefined,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
