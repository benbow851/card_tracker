import { NextResponse } from "next/server";
import {
  mapCardsToPriceCharting,
  refreshEbayPrices,
  refreshOptcgPrices,
  refreshPriceChartingPrices,
  refreshTcgdexPrices,
} from "@/lib/jobs";

// Runs on Node runtime (not Edge) since we use Prisma
export const runtime = "nodejs";
// Vercel Cron + manual triggers — never cache
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min, max for Vercel Pro; Hobby = 60s

/**
 * Triggered by Vercel Cron (and optional manual hits).
 * - GET /api/cron/update-prices?source=optcg     → refresh One Piece (full)
 * - GET /api/cron/update-prices?source=tcgdex    → refresh Pokemon (50-card batch)
 * - GET /api/cron/update-prices?source=all       → both (default)
 *
 * Auth: Bearer CRON_SECRET (Vercel Cron passes this automatically when set).
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "all";
  const batchSize = Number(url.searchParams.get("batch") ?? "50");

  const results = [];

  if (source === "optcg" || source === "all") {
    results.push(await refreshOptcgPrices());
  }

  if (source === "tcgdex" || source === "all") {
    results.push(await refreshTcgdexPrices(batchSize));
  }

  if (source === "pc-mapping") {
    results.push(await mapCardsToPriceCharting(batchSize));
  }

  if (source === "pricecharting" || source === "all") {
    results.push(await refreshPriceChartingPrices(batchSize));
  }

  if (source === "ebay" || source === "all") {
    results.push(await refreshEbayPrices(Math.min(batchSize, 20)));
  }

  // Rotating: pick 1 source per hour based on hour-of-day
  // Lets us fit in Vercel Hobby's 2-cron limit while still hitting every source
  if (source === "rotating") {
    const hour = new Date().getUTCHours();
    if (hour % 6 === 0) {
      results.push(await mapCardsToPriceCharting(30));
    } else if (hour % 3 === 0) {
      results.push(await refreshEbayPrices(15));
    } else if (hour % 2 === 0) {
      results.push(await refreshPriceChartingPrices(50));
    } else {
      results.push(await refreshTcgdexPrices(50));
    }
  }

  return NextResponse.json({
    ok: results.every((r) => r.ok),
    runAt: new Date().toISOString(),
    results,
  });
}
