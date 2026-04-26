import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({ log: ["error", "warn"] });
  try {
    const cards = await prisma.card.findMany({ take: 10 });
    console.log(`✓ Connected. Found ${cards.length} cards:`);
    for (const c of cards) {
      console.log(`  - ${c.name} (${c.setCode})`);
    }
  } catch (err) {
    console.error("✗ DB error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
