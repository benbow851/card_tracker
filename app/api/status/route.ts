import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

/**
 * Status / health endpoint — useful for cron monitoring + admin dashboard.
 * Public read (read-only data; no secrets).
 */
export async function GET() {
  const [cards, prices, sets, jobs, lastPrice] = await Promise.all([
    prisma.card.count(),
    prisma.price.count(),
    prisma.set.count(),
    prisma.updateJob.findMany({ orderBy: { id: "asc" } }),
    prisma.price.findFirst({
      orderBy: { recordedAt: "desc" },
      select: { recordedAt: true, source: true },
    }),
  ]);

  const byCategory = await prisma.card.groupBy({
    by: ["category"],
    _count: { _all: true },
  });

  return NextResponse.json(
    {
      ok: true,
      counts: {
        cards,
        prices,
        sets,
        byCategory: Object.fromEntries(
          byCategory.map((c) => [c.category, c._count._all])
        ),
      },
      lastPriceAt: lastPrice?.recordedAt ?? null,
      lastPriceSource: lastPrice?.source ?? null,
      jobs: jobs.map((j) => ({
        id: j.id,
        status: j.lastStatus,
        cursor: j.cursor,
        total: j.total,
        progress: j.total > 0 ? `${j.cursor}/${j.total}` : "0/0",
        lastRunAt: j.lastRunAt,
        lastError: j.lastError,
        inserted: j.insertedCount,
        errors: j.errorCount,
      })),
    },
    { headers: CACHE_HEADERS }
  );
}
