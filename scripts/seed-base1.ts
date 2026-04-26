/**
 * Re-seed just Pokemon base1 (Base Set) which failed in the main seed.
 * The iconic Charizard set — must not be missing.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getCard, getSet } from "../lib/tcgdex-api";

const prisma = new PrismaClient({ log: ["error"] });
const SOURCE = "tcgdex";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  process.stdout.write("Fetching base1 (Base Set)...\n");

  // Retry getSet up to 3 times
  let setData = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      setData = await getSet("base1");
      break;
    } catch (err) {
      process.stdout.write(
        `  Attempt ${attempt}/3 failed: ${(err as Error).message}\n`
      );
      await sleep(2000 * attempt);
    }
  }
  if (!setData) {
    process.stderr.write("✗ All retries failed for base1.\n");
    process.exit(1);
  }
  process.stdout.write(`Got ${setData.cards.length} cards in base1\n`);

  let cardCount = 0;
  let priceCount = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const stub of setData.cards) {
    let detail;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        detail = await getCard(stub.id);
        break;
      } catch {
        await sleep(1000 * attempt);
      }
    }
    if (!detail) {
      process.stdout.write(`  ✗ ${stub.id} skipped (3 retries)\n`);
      continue;
    }

    const imageUrl = detail.image ? `${detail.image}/high.png` : undefined;

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
        imageUrl,
        rarity: detail.rarity ?? undefined,
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
          cardId_date_source_grade_variant: {
            cardId: card.id,
            date: today,
            source: SOURCE,
            grade: "raw",
              variant: "base",
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
    await sleep(80); // be polite
  }

  await prisma.set.upsert({
    where: { id: "base1" },
    create: { id: "base1", name: setData.name, category: "pokemon", cardCount },
    update: { cardCount },
  });

  process.stdout.write(`\n✓ Done. ${cardCount} cards, ${priceCount} prices.\n`);
}

main()
  .catch((e) => {
    process.stderr.write(`Fatal: ${e}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
