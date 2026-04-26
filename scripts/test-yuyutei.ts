/**
 * Quick test of the Yuyu-Tei scraper on OP-01.
 * Run: cd card-price-tracker && npx tsx scripts/test-yuyutei.ts
 */
import { fetchSetPrices, pickCanonical } from "../lib/yuyutei-api";

async function main() {
  console.log("Fetching OP-01 from Yuyu-Tei…");
  const cards = await fetchSetPrices("OP-01");
  console.log(`Got ${cards.length} card variants\n`);

  // Group by code
  const byCode = new Map<string, typeof cards>();
  for (const c of cards) {
    if (!byCode.has(c.code)) byCode.set(c.code, []);
    byCode.get(c.code)!.push(c);
  }

  console.log(`Unique card codes: ${byCode.size}\n`);
  console.log("Sample (first 10 codes):");
  let i = 0;
  for (const [code, variants] of Array.from(byCode.entries())) {
    if (i++ >= 10) break;
    const cheap = pickCanonical(variants);
    console.log(`  ${code} (${variants.length} variants):`);
    for (const v of variants) {
      const marker = v === cheap ? " ← canonical" : "";
      console.log(
        `    [${v.rarityHint}/${v.variant}] ¥${v.priceJPY.toLocaleString()} (#${v.internalId}) ${v.fullNameJP}${marker}`
      );
    }
  }

  // Stats
  const totalPriced = cards.filter((c) => c.priceJPY > 0).length;
  const outOfStock = cards.filter((c) => c.outOfStock).length;
  console.log(`\nStats: ${totalPriced} priced, ${outOfStock} out-of-stock`);

  // Highest price (likely a SEC card)
  const top = cards
    .filter((c) => c.priceJPY > 0)
    .sort((a, b) => b.priceJPY - a.priceJPY)[0];
  if (top) {
    console.log(`Most expensive: ${top.code} [${top.rarityHint}] ¥${top.priceJPY.toLocaleString()} - ${top.nameJP}`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
