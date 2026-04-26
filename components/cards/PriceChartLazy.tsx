"use client";

import dynamic from "next/dynamic";
import type { PricePoint } from "@/types";

/**
 * Recharts is ~120KB gzipped. Dynamically loaded so it doesn't bloat
 * the entry bundle for users who never open a card detail page.
 */
const PriceChart = dynamic(
  () => import("./PriceChart").then((m) => m.PriceChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] flex items-center justify-center text-on-surface-variant text-sm">
        Loading chart…
      </div>
    ),
  }
);

export function PriceChartLazy({ data }: { data: PricePoint[] }) {
  return <PriceChart data={data} />;
}
