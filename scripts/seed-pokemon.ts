/**
 * Seed Pokemon TCG cards + prices from tcgdex.dev into Supabase.
 * Stores prices in EUR (cardmarket source); UI converts to THB at display time.
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/seed-pokemon.ts            # popular sets only
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/seed-pokemon.ts --all      # all 150+ sets
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getCard, getSet, listSets } from "../lib/tcgdex-api";

const prisma = new PrismaClient({ log: ["error"] });
const SOURCE = "tcgdex";

// Curated subset (most popular / iconic sets) — used by default
const POPULAR_SETS = new Set([
  "base1", // Base Set
  "base2", // Jungle
  "base3", // Fossil
  "base4", // Base Set 2
  "base5", // Team Rocket
  "neo1", // Neo Genesis
  "neo2", // Neo Discovery
  "ex1", // Ruby & Sapphire
  "swsh1", // Sword & Shield
  "swsh4", // Vivid Voltage
  "swsh9", // Brilliant Stars
  "swsh12", // Silver Tempest
  "sv1", // Scarlet & Violet
  "sv03", // Obsidian Flames
  "sv05", // Temporal Forces
]);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function seedSet(setId: string, setName: string) {
  process.stdout.write(`\n→ ${setId} (${setName})\n`);

  const setData = await getSet(setId).catch((e) => {
    process.stdout.write(`  ✗ Failed to fetch: ${(e as Error).message}\n`);
    return null;
  });
  if (!setData) return { cards: 0, prices: 0 };

  let cardCount = 0;
  let priceCount = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const stub of setData.cards) {
    let detail;
    try {
      detail = await getCard(stub.id);
    } catch (e) {
      process.stdout.write(
        `  ✗ ${stub.id} fetch: ${(e as Error).message}\n`
      );
      continue;
    }

    const imageUrl = detail.image
      ? `${detail.image}/high.png`
      : undefined;

    try {
      const card = await prisma.card.upsert({
        where: { externalId: detail.id },
        create: {
          externalId: detail.id,
          name: detail.name,
          cardNumber: detail.localId,
          setName: setData.name,
          setCode: setData.id,
          rarity: detail.rarity ?? undefined,
          imageUrl,
          category: "pokemon",
          series: "Pokémon TCG",
          language: "English",
          cardType: detail.category ?? undefined,
          subTypes: detail.types?.join(", ") ?? undefined,
          cardPower: detail.hp ? `${detail.hp}` : undefined,
        },
        update: {
          name: detail.name,
          rarity: detail.rarity ?? undefined,
          imageUrl,
          cardType: detail.category ?? undefined,
          subTypes: detail.types?.join(", ") ?? undefined,
          cardPower: detail.hp ? `${detail.hp}` : undefined,
        },
      });
      cardCount++;

      const cm = detail.pricing?.cardmarket;
      const price = cm?.avg ?? cm?.trend ?? cm?.low ?? null;
      if (cm && price && price > 0) {
        await prisma.price.create({
          data: {
            cardId: card.id,
            source: SOURCE,
            price,
            currency: cm.unit ?? "EUR",
            condition: "NM",
          },
        });
        await prisma.priceHistory.upsert({
          where: {
            cardId_date_source_grade: {
              cardId: card.id,
              date: today,
              source: SOURCE,
              grade: "raw",
            },
          },
          create: {
            cardId: card.id,
            date: today,
            source: SOURCE,
            grade: "raw",
            avgPrice: price,
            minPrice: cm.low ?? price,
            maxPrice: cm.trend ?? price,
            volume: 1,
          },
          update: {
            avgPrice: price,
            minPrice: cm.low ?? price,
            maxPrice: cm.trend ?? price,
          },
        });
        priceCount++;
      }
    } catch (err) {
      process.stdout.write(
        `  ✗ Card ${detail.id}: ${(err as Error).message}\n`
      );
    }

    // Throttle the per-card detail fetch
    await sleep(50);
  }

  await prisma.set.upsert({
    where: { id: setId },
    create: {
      id: setId,
      name: setName,
      category: "pokemon",
      cardCount,
    },
    update: { name: setName, cardCount },
  });

  process.stdout.write(
    `  ✓ ${cardCount} cards, ${priceCount} prices\n`
  );
  return { cards: cardCount, prices: priceCount };
}

async function main() {
  const all = process.argv.includes("--all");
  process.stdout.write("Fetching sets list...\n");
  const sets = await listSets();
  const targets = all ? sets : sets.filter((s) => POPULAR_SETS.has(s.id));
  process.stdout.write(
    `Found ${sets.length} total. Seeding ${targets.length} ${
      all ? "(all)" : "(popular subset)"
    }.\n`
  );

  let totalCards = 0;
  let totalPrices = 0;
  for (const set of targets) {
    const r = await seedSet(set.id, set.name);
    totalCards += r.cards;
    totalPrices += r.prices;
    await sleep(300);
  }

  process.stdout.write(
    `\n=========================\n✓ Done. ${totalCards} cards, ${totalPrices} prices imported.\n`
  );
}

main()
  .catch((e) => {
    process.stderr.write(`Fatal: ${e}\n`);
    if (e?.cause) process.stderr.write(`Cause: ${JSON.stringify(e.cause, null, 2)}\n`);
    if (e?.stack) process.stderr.write(`Stack: ${e.stack}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
