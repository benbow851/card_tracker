"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@/types";
import { formatPrice } from "@/lib/utils";

export function PriceChart({ data }: { data: PricePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3bbffa" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#3bbffa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          stroke="#a3aac4"
          tick={{ fontSize: 10, fill: "#a3aac4" }}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
        />
        <YAxis
          stroke="#a3aac4"
          tick={{ fontSize: 10, fill: "#a3aac4" }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => formatPrice(v).replace(".00", "")}
        />
        <Tooltip
          cursor={{ stroke: "#3bbffa", strokeWidth: 1, strokeDasharray: "4 4" }}
          contentStyle={{
            background: "#141f38",
            border: "none",
            borderRadius: 8,
            color: "#dee5ff",
            fontSize: 12,
          }}
          formatter={(value) => [formatPrice(Number(value)), "Price"]}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#3bbffa"
          strokeWidth={2}
          fill="url(#priceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
