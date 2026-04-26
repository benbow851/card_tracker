import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  shimmer,
}: {
  children: React.ReactNode;
  className?: string;
  shimmer?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl",
        shimmer && "shimmer-bg",
        className
      )}
    >
      {children}
    </div>
  );
}
