/**
 * Seed One Piece TCG cards + prices from optcgapi.com into Supabase.
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-optcg.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { listSets, getSetCards, type OptcgCard } from "../lib/optcg-api";

const prisma = new PrismaClient({ log: ["error"] });
const SOURCE = "optcgapi";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function seedSet(setId: string, setName: string) {
  process.stdout.write(`\n→ ${setId} (${setName})\n`);
  let cards: OptcgCard[];
  try {
    cards = await getSetCards(setId);
  } catch (e) {
    console.error(`  ✗ Failed to fetch ${setId}:`, (e as Error).message);
    return { cards: 0, prices: 0 };
  }

  let cardCount = 0;
  let priceCount = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const c of cards) {
    try {
      const card = await prisma.card.upsert({
        where: { externalId: c.card_set_id },
        create: {
          externalId: c.card_set_id,
          name: c.card_name,
          cardNumber: c.card_set_id,
          setName: c.set_name,
          setCode: c.set_id,
          rarity: c.rarity ?? undefined,
          imageUrl: c.card_image,
          category: "one-piece",
          series: "One Piece TCG",
          language: "English",
          cardColor: c.card_color ?? undefined,
          cardType: c.card_type ?? undefined,
          cardCost: c.card_cost ?? undefined,
          cardPower: c.card_power ?? undefined,
          subTypes: c.sub_types ?? undefined,
          attribute: c.attribute ?? undefined,
          counterAmount: c.counter_amount ?? undefined,
          life: c.life ?? undefined,
          cardText: c.card_text ?? undefined,
        },
        update: {
          name: c.card_name,
          setName: c.set_name,
          rarity: c.rarity ?? undefined,
          imageUrl: c.card_image,
          cardColor: c.card_color ?? undefined,
          cardType: c.card_type ?? undefined,
          cardCost: c.card_cost ?? undefined,
          cardPower: c.card_power ?? undefined,
          subTypes: c.sub_types ?? undefined,
          attribute: c.attribute ?? undefined,
          counterAmount: c.counter_amount ?? undefined,
          life: c.life ?? undefined,
          cardText: c.card_text ?? undefined,
        },
      });
      cardCount++;

      const price = c.market_price ?? c.inventory_price;
      if (price && price > 0) {
        await prisma.price.create({
          data: {
            cardId: card.id,
            source: SOURCE,
            price,
            currency: "USD",
            condition: "NM",
          },
        });

        // upsert price_history daily aggregate
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
        priceCount++;
      }
    } catch (err) {
      console.error(`  ✗ Card ${c.card_set_id}:`, (err as Error).message);
    }
  }

  await prisma.set.upsert({
    where: { id: setId },
    create: {
      id: setId,
      name: setName,
      category: "one-piece",
      cardCount: cardCount,
    },
    update: { name: setName, cardCount: cardCount },
  });

  process.stdout.write(`  ✓ ${cardCount} cards, ${priceCount} prices\n`);
  return { cards: cardCount, prices: priceCount };
}

async function main() {
  process.stdout.write("Fetching sets list...\n");
  const sets = await listSets();
  process.stdout.write(`Found ${sets.length} sets\n`);

  let totalCards = 0;
  let totalPrices = 0;
  for (const set of sets) {
    const result = await seedSet(set.set_id, set.set_name);
    totalCards += result.cards;
    totalPrices += result.prices;
    await sleep(300);
  }

  process.stdout.write(`\n=========================\n`);
  process.stdout.write(
    `✓ Done. ${totalCards} cards, ${totalPrices} prices imported.\n`
  );
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
