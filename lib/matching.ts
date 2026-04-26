/**
 * Card-matching helpers for unstructured listing titles (eBay, Mercari, etc).
 *
 * Strategy (3 tiers):
 * 1. Set-code regex extraction (most reliable, ~95% accuracy)
 * 2. Targeted query construction (avoids broad mismatches)
 * 3. Fuzzy similarity match via pg_trgm (fallback when no set code present)
 */

/**
 * Known set-code patterns across supported TCGs.
 * Add new patterns here when expanding to other games.
 */
const SET_CODE_PATTERNS: RegExp[] = [
  /OP\d{2}-\d{3}/i,            // One Piece: OP05-119
  /EB\d{2}-\d{3}/i,            // One Piece Extra Booster
  /PRB\d{2}-\d{3}/i,           // One Piece Premium
  /ST-?\d{2}-\d{3}/i,          // One Piece Starter Decks
  /BS-\d{3}/i,                 // Pokemon Base Set
  /LOB-\d{3}/i,                // Yu-Gi-Oh! Legend of Blue Eyes
  /[a-z]{2,5}\d?-\d{1,3}/i,    // generic set-localId pattern
];

/**
 * Extract a card external_id (e.g. "OP05-119") from a free-form listing title.
 * Returns null when no recognizable set code is present.
 */
export function extractSetCode(title: string): string | null {
  for (const pattern of SET_CODE_PATTERNS) {
    const match = title.match(pattern);
    if (match) return match[0].toUpperCase();
  }
  return null;
}

/**
 * Build a targeted eBay search query from a known card.
 * The set code anchors the search; the name disambiguates further.
 */
export function buildSearchQuery(card: {
  name: string;
  externalId?: string | null;
  setCode?: string | null;
}): string {
  const parts: string[] = [];
  // Strip qualifiers in parens for cleaner queries
  const base = card.name.replace(/\([^)]*\)/g, "").trim();
  parts.push(base);
  if (card.externalId) parts.push(card.externalId);
  else if (card.setCode) parts.push(card.setCode);
  return parts.join(" ");
}

/**
 * Verify a listing actually matches the target card by requiring
 * the external_id to appear in the title. Removes false positives
 * (e.g. proxy cards, custom prints, similarly-named characters).
 */
export function verifyMatch(
  listingTitle: string,
  card: { externalId?: string | null }
): boolean {
  if (!card.externalId) return false;
  const re = new RegExp(card.externalId.replace("-", "[-\\s]?"), "i");
  return re.test(listingTitle);
}

/**
 * Trim/normalize a name for trigram comparison.
 * Removes common qualifiers that vary between sources.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "") // remove parenthetical qualifiers
    .replace(/\b(parallel|alternate art|manga|holo|foil|psa[-\s]?\d+|cgc[-\s]?[\d.]+)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract grade from eBay listing title.
 * Returns canonical grade string ("raw", "PSA10", "BGS9.5", etc.) or null.
 */
export function extractGrade(title: string): string | null {
  // PSA / SGC / CGC / BGS — accept "PSA 10", "PSA10", "PSA-10"
  const psa = title.match(/\b(PSA)[\s-]?(\d{1,2}(?:\.\d)?)\b/i);
  if (psa) return `PSA${psa[2]}`;
  const bgs = title.match(/\b(BGS)[\s-]?(\d{1,2}(?:\.\d)?)\b/i);
  if (bgs) return `BGS${bgs[2]}`;
  const cgc = title.match(/\b(CGC)[\s-]?(\d{1,2}(?:\.\d)?)\b/i);
  if (cgc) return `CGC${cgc[2]}`;
  const sgc = title.match(/\b(SGC)[\s-]?(\d{1,2}(?:\.\d)?)\b/i);
  if (sgc) return `SGC${sgc[2]}`;
  // No grade keyword → assume raw
  return "raw";
}

/**
 * Compute robust mean price from a list of listings, removing outliers.
 * Standard 1.5×IQR fence — protects against bad data (typo prices, troll listings).
 */
export function robustMean(prices: number[]): number {
  if (prices.length === 0) return 0;
  if (prices.length < 4) {
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lo = q1 - iqr * 1.5;
  const hi = q3 + iqr * 1.5;
  const filtered = sorted.filter((p) => p >= lo && p <= hi);
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}
