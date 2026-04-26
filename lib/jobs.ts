import "server-only";
import { prisma } from "@/lib/prisma";
import { listSets as optcgListSets, getSetCards as optcgGetSetCards } from "@/lib/optcg-api";
import { getCard as tcgdexGetCard } from "@/lib/tcgdex-api";
import {
  CONSOLE_NAME,
  extractGrades,
  getProduct as pcGetProduct,
  isConfigured as pcConfigured,
  matchConfidence,
  searchProducts as pcSearch,
} from "@/lib/pricecharting-api";
import {
  buildGradedQuery,
  isConfigured as ebayConfigured,
  searchActive as ebaySearch,
} from "@/lib/ebay-api";
import { extractGrade, robustMean, verifyMatch } from "@/lib/matching";
import { fetchSetPrices, sleep as ytSleep } from "@/lib/yuyutei-api";

const SOURCE_OPTCG = "optcgapi";
const SOURCE_TCGDEX = "tcgdex";
const SOURCE_PC = "pricecharting";
const SOURCE_EBAY = "ebay";
const SOURCE_YUYUTEI = "yuyutei";
const TODAY = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export interface JobResult {
  jobId: string;
  ok: boolean;
  durationMs: number;
  inserted: number;
  updated: number;
  errors: number;
  cursor: number;
  total: number;
  done: boolean;
  message?: string;
}

async function markRunning(jobId: string) {
  await prisma.updateJob.upsert({
    where: { id: jobId },
    create: { id: jobId, lastStatus: "running", lastRunAt: new Date() },
    update: { lastStatus: "running", lastRunAt: new Date(), lastError: null },
  });
}

async function markFinished(
  jobId: string,
  patch: Partial<{
    cursor: number;
    total: number;
    insertedCount: number;
    updatedCount: number;
    errorCount: number;
    lastStatus: string;
    lastError: string | null;
  }>
) {
  await prisma.updateJob.update({
    where: { id: jobId },
    data: { ...patch, lastRunAt: new Date() },
  });
}

/**
 * Refresh all One Piece prices in one shot.
 * OPTCG API exposes /allSetCards/ — single fetch yields the entire catalog.
 * Append-only inserts into `prices`, daily upsert into `price_history`.
 */
export async function refreshOptcgPrices(): Promise<JobResult> {
  const jobId = "optcg-prices";
  const start = Date.now();
  await markRunning(jobId);

  let inserted = 0;
  let errors = 0;
  const today = TODAY();

  try {
    const sets = await optcgListSets();
    let totalCards = 0;

    for (const set of sets) {
      let cards;
      try {
        cards = await optcgGetSetCards(set.set_id);
      } catch (err) {
        console.error(`[optcg-cron] set ${set.set_id} failed:`, err);
        errors++;
        continue;
      }
      totalCards += cards.length;

      for (const c of cards) {
        const price = c.market_price ?? c.inventory_price;
        if (!price || price <= 0) continue;

        const dbCard = await prisma.card.findUnique({
          where: { externalId: c.card_set_id },
          select: { id: true },
        });
        if (!dbCard) continue; // card not yet seeded — skip

        try {
          await prisma.price.create({
            data: {
              cardId: dbCard.id,
              source: SOURCE_OPTCG,
              price,
              currency: "USD",
              condition: "NM",
            },
          });
          await prisma.priceHistory.upsert({
            where: {
              cardId_date_source_grade_variant: {
                cardId: dbCard.id,
                date: today,
                source: SOURCE_OPTCG,
                grade: "raw",
              variant: "base",
              },
            },
            create: {
              cardId: dbCard.id,
              date: today,
              source: SOURCE_OPTCG,
              grade: "raw",
              avgPrice: price,
              minPrice: c.inventory_price ?? price,
              maxPrice: c.market_price ?? price,
              volume: 1,
            },
            update: {
              avgPrice: price,
              minPrice: c.inventory_price ?? price,
              maxPrice: c.market_price ?? price,
            },
          });
          inserted++;
        } catch (err) {
          console.error(`[optcg-cron] price ${c.card_set_id}:`, err);
          errors++;
        }
      }
    }

    await markFinished(jobId, {
      total: totalCards,
      cursor: totalCards,
      insertedCount: inserted,
      errorCount: errors,
      lastStatus: "completed",
    });

    return {
      jobId,
      ok: true,
      durationMs: Date.now() - start,
      inserted,
      updated: 0,
      errors,
      cursor: totalCards,
      total: totalCards,
      done: true,
    };
  } catch (err) {
    await markFinished(jobId, {
      lastStatus: "error",
      lastError: (err as Error).message,
    });
    return {
      jobId,
      ok: false,
      durationMs: Date.now() - start,
      inserted,
      updated: 0,
      errors: errors + 1,
      cursor: 0,
      total: 0,
      done: false,
      message: (err as Error).message,
    };
  }
}

/**
 * Refresh Pokemon prices incrementally (cursor-based, batched).
 * TCGdex requires per-card fetch → split work across multiple cron runs.
 *
 * @param batchSize cards to process per invocation (default 50, ~150s safe)
 */
export async function refreshTcgdexPrices(batchSize = 50): Promise<JobResult> {
  const jobId = "tcgdex-prices";
  const start = Date.now();
  await markRunning(jobId);

  // Find / init the job's cursor
  const job = await prisma.updateJob.findUnique({ where: { id: jobId } });
  const total = await prisma.card.count({
    where: { category: "pokemon", externalId: { not: null } },
  });

  // If cursor at end, restart for next day
  let cursor = job?.cursor ?? 0;
  if (cursor >= total) cursor = 0;

  const cards = await prisma.card.findMany({
    where: { category: "pokemon", externalId: { not: null } },
    select: { id: true, externalId: true },
    orderBy: { id: "asc" },
    skip: cursor,
    take: batchSize,
  });

  const today = TODAY();
  let inserted = 0;
  let errors = 0;

  for (const dbCard of cards) {
    if (!dbCard.externalId) continue;
    try {
      const detail = await tcgdexGetCard(dbCard.externalId);
      const cm = detail.pricing?.cardmarket;
      const price = cm?.avg ?? cm?.trend ?? cm?.low ?? null;
      if (!price || price <= 0) continue;

      await prisma.price.create({
        data: {
          cardId: dbCard.id,
          source: SOURCE_TCGDEX,
          price,
          currency: cm?.unit ?? "EUR",
          condition: "NM",
        },
      });
      await prisma.priceHistory.upsert({
        where: {
          cardId_date_source_grade_variant: {
            cardId: dbCard.id,
            date: today,
            source: SOURCE_TCGDEX,
            grade: "raw",
              variant: "base",
          },
        },
        create: {
          cardId: dbCard.id,
          date: today,
          source: SOURCE_TCGDEX,
          grade: "raw",
          avgPrice: price,
          minPrice: cm?.low ?? price,
          maxPrice: cm?.trend ?? price,
          volume: 1,
        },
        update: {
          avgPrice: price,
          minPrice: cm?.low ?? price,
          maxPrice: cm?.trend ?? price,
        },
      });
      inserted++;
    } catch (err) {
      console.error(`[tcgdex-cron] ${dbCard.externalId}:`, err);
      errors++;
    }

    // Light throttle (TCGdex per-card endpoint)
    await new Promise((r) => setTimeout(r, 50));
  }

  const newCursor = cursor + cards.length;
  const done = newCursor >= total;

  await markFinished(jobId, {
    total,
    cursor: done ? 0 : newCursor,
    insertedCount: inserted,
    errorCount: errors,
    lastStatus: done ? "completed" : "running",
  });

  return {
    jobId,
    ok: true,
    durationMs: Date.now() - start,
    inserted,
    updated: 0,
    errors,
    cursor: newCursor,
    total,
    done,
  };
}

/**
 * Map our cards → PriceCharting product IDs by searching their catalog.
 * Cursor-based; processes `batchSize` unmapped cards per invocation.
 *
 * Skipped silently if PRICECHARTING_TOKEN is not set.
 */
export async function mapCardsToPriceCharting(batchSize = 30): Promise<JobResult> {
  const jobId = "pricecharting-mapping";
  const start = Date.now();

  if (!pcConfigured()) {
    return {
      jobId,
      ok: false,
      durationMs: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      cursor: 0,
      total: 0,
      done: false,
      message: "PRICECHARTING_TOKEN not configured",
    };
  }

  await markRunning(jobId);

  const total = await prisma.card.count({
    where: { pricechartingId: null, externalId: { not: null } },
  });

  const cards = await prisma.card.findMany({
    where: { pricechartingId: null, externalId: { not: null } },
    take: batchSize,
    orderBy: { id: "asc" },
  });

  let mapped = 0;
  let errors = 0;

  for (const card of cards) {
    try {
      const consoleName = CONSOLE_NAME[card.category];
      const query = `${card.name} ${card.cardNumber ?? ""}`.trim();
      const results = await pcSearch(query, consoleName);
      if (!results || results.length === 0) {
        // mark as searched-but-not-found to avoid re-querying every run
        await prisma.card.update({
          where: { id: card.id },
          data: {
            pricechartingMatchedAt: new Date(),
            pricechartingMatchConfidence: 0,
          },
        });
        continue;
      }
      // Pick highest-confidence result
      const ranked = results
        .map((r) => ({ r, score: matchConfidence(card, r) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      // Only persist if confidence is reasonable
      if (best.score < 0.4) {
        await prisma.card.update({
          where: { id: card.id },
          data: {
            pricechartingMatchedAt: new Date(),
            pricechartingMatchConfidence: best.score,
          },
        });
        continue;
      }
      await prisma.card.update({
        where: { id: card.id },
        data: {
          pricechartingId: best.r.id,
          pricechartingMatchedAt: new Date(),
          pricechartingMatchConfidence: best.score,
        },
      });
      mapped++;
    } catch (err) {
      console.error(`[pc-mapping] ${card.id}:`, err);
      errors++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const cursor = cards.length;
  const done = cursor < batchSize;
  await markFinished(jobId, {
    total,
    cursor,
    insertedCount: mapped,
    errorCount: errors,
    lastStatus: done ? "completed" : "running",
  });

  return {
    jobId,
    ok: true,
    durationMs: Date.now() - start,
    inserted: mapped,
    updated: 0,
    errors,
    cursor,
    total,
    done,
  };
}

/**
 * Refresh graded price tiers from PriceCharting for cards that have been mapped.
 * Inserts one Price row per grade per card per run; cursor-based.
 *
 * Skipped silently if PRICECHARTING_TOKEN is not set.
 */
export async function refreshPriceChartingPrices(
  batchSize = 50
): Promise<JobResult> {
  const jobId = "pricecharting-prices";
  const start = Date.now();

  if (!pcConfigured()) {
    return {
      jobId,
      ok: false,
      durationMs: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      cursor: 0,
      total: 0,
      done: false,
      message: "PRICECHARTING_TOKEN not configured",
    };
  }

  await markRunning(jobId);

  const total = await prisma.card.count({
    where: { pricechartingId: { not: null } },
  });
  const job = await prisma.updateJob.findUnique({ where: { id: jobId } });
  let cursor = job?.cursor ?? 0;
  if (cursor >= total) cursor = 0;

  const cards = await prisma.card.findMany({
    where: { pricechartingId: { not: null } },
    select: { id: true, pricechartingId: true },
    orderBy: { id: "asc" },
    skip: cursor,
    take: batchSize,
  });

  const today = TODAY();
  let inserted = 0;
  let errors = 0;

  for (const card of cards) {
    if (!card.pricechartingId) continue;
    try {
      const product = await pcGetProduct(card.pricechartingId);
      if (!product) continue;
      const grades = extractGrades(product);

      for (const tier of grades) {
        await prisma.price.create({
          data: {
            cardId: card.id,
            source: SOURCE_PC,
            price: tier.priceUsd,
            currency: "USD",
            grade: tier.grade,
              variant: "base",
          },
        });
        await prisma.priceHistory.upsert({
          where: {
            cardId_date_source_grade_variant: {
              cardId: card.id,
              date: today,
              source: SOURCE_PC,
              grade: tier.grade,
              variant: "base",
            },
          },
          create: {
            cardId: card.id,
            date: today,
            source: SOURCE_PC,
            grade: tier.grade,
            avgPrice: tier.priceUsd,
            minPrice: tier.priceUsd,
            maxPrice: tier.priceUsd,
            volume: 1,
          },
          update: {
            avgPrice: tier.priceUsd,
            minPrice: tier.priceUsd,
            maxPrice: tier.priceUsd,
          },
        });
        inserted++;
      }
    } catch (err) {
      console.error(`[pc-prices] ${card.pricechartingId}:`, err);
      errors++;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  const newCursor = cursor + cards.length;
  const done = newCursor >= total;

  await markFinished(jobId, {
    total,
    cursor: done ? 0 : newCursor,
    insertedCount: inserted,
    errorCount: errors,
    lastStatus: done ? "completed" : "running",
  });

  return {
    jobId,
    ok: true,
    durationMs: Date.now() - start,
    inserted,
    updated: 0,
    errors,
    cursor: newCursor,
    total,
    done,
  };
}

/**
 * Refresh prices for high-value cards from eBay (active listings).
 *
 * Strategy:
 *  1. Pick batch of cards (cursor-based, oldest-update first).
 *  2. For each grade we want (raw, PSA9, PSA10, BGS10):
 *     - Search eBay with targeted query incl. grade keyword
 *     - Verify each result's title contains our card's external_id
 *     - Extract grade from each title (filter mismatches)
 *     - robustMean of top N matching prices → save
 *  3. Insert one Price row per (card, grade), upsert daily history.
 *
 * Skipped silently if EBAY_CLIENT_ID/SECRET not set.
 */
const EBAY_GRADES = ["raw", "PSA9", "PSA10", "BGS10"];

export async function refreshEbayPrices(batchSize = 20): Promise<JobResult> {
  const jobId = "ebay-prices";
  const start = Date.now();

  if (!ebayConfigured()) {
    return {
      jobId,
      ok: false,
      durationMs: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      cursor: 0,
      total: 0,
      done: false,
      message: "EBAY_CLIENT_ID/SECRET not configured",
    };
  }

  await markRunning(jobId);

  const total = await prisma.card.count({
    where: {
      externalId: { not: null },
      prices: { some: { price: { gt: 5 } } },
    },
  });

  const job = await prisma.updateJob.findUnique({ where: { id: jobId } });
  let cursor = job?.cursor ?? 0;
  if (cursor >= total) cursor = 0;

  const cards = await prisma.card.findMany({
    where: {
      externalId: { not: null },
      prices: { some: { price: { gt: 5 } } },
    },
    select: { id: true, name: true, externalId: true, setCode: true },
    orderBy: { id: "asc" },
    skip: cursor,
    take: batchSize,
  });

  const today = TODAY();
  let inserted = 0;
  let errors = 0;

  for (const card of cards) {
    for (const grade of EBAY_GRADES) {
      try {
        const query = buildGradedQuery(card, grade);
        const result = await ebaySearch(query, { limit: 25 });
        if (!result?.itemSummaries) continue;

        const matches = result.itemSummaries.filter((item) => {
          if (!verifyMatch(item.title, card)) return false;
          const itemGrade = extractGrade(item.title) ?? "raw";
          return itemGrade === grade;
        });
        if (matches.length === 0) continue;

        const prices = matches
          .map((m) => Number(m.price?.value ?? 0))
          .filter((p) => p > 0);
        if (prices.length === 0) continue;
        const avg = robustMean(prices);

        await prisma.price.create({
          data: {
            cardId: card.id,
            source: SOURCE_EBAY,
            price: avg,
            currency: "USD",
            grade,
          },
        });
        await prisma.priceHistory.upsert({
          where: {
            cardId_date_source_grade_variant: {
              cardId: card.id,
              date: today,
              source: SOURCE_EBAY,
              grade,
              variant: "base",
            },
          },
          create: {
            cardId: card.id,
            date: today,
            source: SOURCE_EBAY,
            grade,
            avgPrice: avg,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            volume: prices.length,
          },
          update: {
            avgPrice: avg,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            volume: prices.length,
          },
        });
        inserted++;
      } catch (err) {
        console.error(`[ebay] ${card.externalId} ${grade}:`, err);
        errors++;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const newCursor = cursor + cards.length;
  const done = newCursor >= total;

  await markFinished(jobId, {
    total,
    cursor: done ? 0 : newCursor,
    insertedCount: inserted,
    errorCount: errors,
    lastStatus: done ? "completed" : "running",
  });

  return {
    jobId,
    ok: true,
    durationMs: Date.now() - start,
    inserted,
    updated: 0,
    errors,
    cursor: newCursor,
    total,
    done,
  };
}

/**
 * Refresh JPY prices from Yuyu-Tei (遊々亭).
 * Iterates One Piece sets in our DB, scrapes each set's listing page once,
 * inserts price rows in JPY (no FX conversion at write — UI converts).
 *
 * One row per (card, variant) — variant carried in the `grade` column:
 *   - "raw"     for the canonical (cheapest) entry of each card code
 *   - "P-SR"/"P-SEC"/etc.  for parallel/alt-art variants
 *
 * Throttle: 2.5s between sets — full One Piece catalog (20 sets) in ~1 min.
 * Yuyu-Tei robots.txt is permissive but we identify ourselves and stay polite.
 */
export async function refreshYuyuTeiPrices(): Promise<JobResult> {
  const jobId = "yuyutei-prices";
  const start = Date.now();
  await markRunning(jobId);

  const today = TODAY();
  let inserted = 0;
  let errors = 0;

  // Get One Piece sets we currently have in the DB
  const sets = await prisma.set.findMany({
    where: { category: "one-piece" },
    select: { id: true, name: true },
  });

  for (const set of sets) {
    try {
      const rows = await fetchSetPrices(set.id);

      // Group by card code → can have multiple variants per code
      const byCode = new Map<string, typeof rows>();
      for (const r of rows) {
        if (!byCode.has(r.code)) byCode.set(r.code, []);
        byCode.get(r.code)!.push(r);
      }

      for (const [code, variants] of Array.from(byCode.entries())) {
        // Find our DB card by external_id
        const card = await prisma.card.findUnique({
          where: { externalId: code },
          select: { id: true },
        });
        if (!card) continue;

        // Insert canonical (cheapest) as 'raw'
        const priced = variants.filter((v) => v.priceJPY > 0 && !v.outOfStock);
        if (priced.length === 0) continue;
        const canonical = priced.reduce((a, b) =>
          a.priceJPY <= b.priceJPY ? a : b
        );

        await prisma.price.create({
          data: {
            cardId: card.id,
            source: SOURCE_YUYUTEI,
            price: canonical.priceJPY,
            currency: "JPY",
            grade: "raw",
            condition: "NM",
          },
        });
        await prisma.priceHistory.upsert({
          where: {
            cardId_date_source_grade_variant: {
              cardId: card.id,
              date: today,
              source: SOURCE_YUYUTEI,
              grade: "raw",
              variant: "base",
            },
          },
          create: {
            cardId: card.id,
            date: today,
            source: SOURCE_YUYUTEI,
            grade: "raw",
            avgPrice: canonical.priceJPY,
            minPrice: Math.min(...priced.map((v) => v.priceJPY)),
            maxPrice: Math.max(...priced.map((v) => v.priceJPY)),
            volume: priced.length,
          },
          update: {
            avgPrice: canonical.priceJPY,
            minPrice: Math.min(...priced.map((v) => v.priceJPY)),
            maxPrice: Math.max(...priced.map((v) => v.priceJPY)),
            volume: priced.length,
          },
        });
        inserted++;

        // Track parallel/alt-art variants separately
        const alts = priced.filter(
          (v) => v !== canonical && v.rarityHint?.startsWith("P-")
        );
        for (const alt of alts) {
          const altGrade = alt.rarityHint ?? "alt";
          await prisma.price.create({
            data: {
              cardId: card.id,
              source: SOURCE_YUYUTEI,
              price: alt.priceJPY,
              currency: "JPY",
              grade: altGrade,
              condition: "NM",
            },
          });
          await prisma.priceHistory.upsert({
            where: {
              cardId_date_source_grade_variant: {
                cardId: card.id,
                date: today,
                source: SOURCE_YUYUTEI,
                grade: altGrade,
              variant: "base",
              },
            },
            create: {
              cardId: card.id,
              date: today,
              source: SOURCE_YUYUTEI,
              grade: altGrade,
              avgPrice: alt.priceJPY,
              minPrice: alt.priceJPY,
              maxPrice: alt.priceJPY,
              volume: 1,
            },
            update: {
              avgPrice: alt.priceJPY,
              minPrice: alt.priceJPY,
              maxPrice: alt.priceJPY,
            },
          });
          inserted++;
        }
      }

      console.log(`[yuyutei] ${set.id}: ${byCode.size} unique codes`);
    } catch (err) {
      console.error(`[yuyutei] ${set.id} failed:`, err);
      errors++;
    }

    // Polite throttle — Yuyu-Tei is small/free
    await ytSleep(2500);
  }

  await markFinished(jobId, {
    total: sets.length,
    cursor: sets.length,
    insertedCount: inserted,
    errorCount: errors,
    lastStatus: "completed",
  });

  return {
    jobId,
    ok: true,
    durationMs: Date.now() - start,
    inserted,
    updated: 0,
    errors,
    cursor: sets.length,
    total: sets.length,
    done: true,
  };
}
