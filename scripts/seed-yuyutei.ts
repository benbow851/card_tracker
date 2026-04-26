/**
 * Standalone Yuyu-Tei (遊々亭) JPY price seed.
 * Mirrors lib/jobs.ts refreshYuyuTeiPrices() but works outside Next.js
 * (which jobs.ts can't due to "server-only" import).
 *
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-yuyutei.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fetchSetPrices, sleep } from "../lib/yuyutei-api";

const prisma = new PrismaClient({ log: ["error"] });
const SOURCE = "yuyutei";

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const t0 = Date.now();
  const sets = await prisma.set.findMany({
    where: { category: "one-piece" },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
  process.stdout.write(`Yuyu-Tei seed: ${sets.length} One Piece sets to scrape\n\n`);

  let totalCanonical = 0;
  let setErrors = 0;
  const day = today();

  for (const set of sets) {
    process.stdout.write(`→ ${set.id} (${set.name})\n`);
    let rows;
    try {
      rows = await fetchSetPrices(set.id);
    } catch (err) {
      process.stdout.write(`  ✗ Fetch failed: ${(err as Error).message}\n\n`);
      setErrors++;
      await sleep(2500);
      continue;
    }

    // Group by code
    const byCode = new Map<string, typeof rows>();
    for (const r of rows) {
      if (!byCode.has(r.code)) byCode.set(r.code, []);
      byCode.get(r.code)!.push(r);
    }

    let setRows = 0;

    for (const [code, codeVariants] of Array.from(byCode.entries())) {
      const card = await prisma.card.findUnique({
        where: { externalId: code },
        select: { id: true },
      });
      if (!card) continue;

      const priced = codeVariants.filter((v) => v.priceJPY > 0 && !v.outOfStock);
      if (priced.length === 0) continue;

      // Insert ONE row per (rarity, variant) tuple — physical print version
      for (const v of priced) {
        const grade = v.rarityHint?.startsWith("P-") ? v.rarityHint : "raw";
        const variant = v.variant ?? "base";
        await prisma.price.create({
          data: {
            cardId: card.id,
            source: SOURCE,
            price: v.priceJPY,
            currency: "JPY",
            grade,
            variant,
            condition: "NM",
          },
        });
        await prisma.priceHistory.upsert({
          where: {
            cardId_date_source_grade_variant: {
              cardId: card.id,
              date: day,
              source: SOURCE,
              grade,
              variant,
            },
          },
          create: {
            cardId: card.id,
            date: day,
            source: SOURCE,
            grade,
            variant,
            avgPrice: v.priceJPY,
            minPrice: v.priceJPY,
            maxPrice: v.priceJPY,
            volume: 1,
          },
          update: {
            avgPrice: v.priceJPY,
            minPrice: v.priceJPY,
            maxPrice: v.priceJPY,
          },
        });
        setRows++;
      }
    }

    totalCanonical += setRows;
    process.stdout.write(
      `  ✓ ${setRows} variant prices (${byCode.size} unique codes)\n\n`
    );

    await sleep(2500); // be polite to Yuyu-Tei
  }

  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  process.stdout.write(
    `\n=========================\n` +
      `✓ Done in ${dur}s · ${totalCanonical} variant prices imported (${setErrors} set errors)\n`
  );
}

main()
  .catch((e) => {
    process.stderr.write(`Fatal: ${e}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
