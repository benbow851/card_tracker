/**
 * PriceCharting / SportsCardsPro API client.
 * Docs: https://www.pricecharting.com/api-documentation
 *
 * Auth: 40-char API token via ?t=TOKEN query param.
 *       Set PRICECHARTING_TOKEN in env. Without it, all calls return null
 *       (graceful no-op so the rest of the app keeps working).
 *
 * Coverage: Pokemon, One Piece, Yu-Gi-Oh, MTG, Sports cards, Comics, Games.
 */

const BASE = "https://www.pricecharting.com";

function token(): string | null {
  return process.env.PRICECHARTING_TOKEN ?? null;
}

export function isConfigured(): boolean {
  return !!process.env.PRICECHARTING_TOKEN;
}

// PriceCharting "console-name" mapping per category
export const CONSOLE_NAME: Record<string, string> = {
  "one-piece": "One Piece Card Game",
  pokemon: "Pokemon",
  "yu-gi-oh": "Yu-Gi-Oh!",
  magic: "Magic: The Gathering",
};

/**
 * Raw product response from PriceCharting.
 * All prices are in CENTS (USD) — divide by 100 for dollars.
 */
export interface PCProduct {
  status: "success" | "error";
  id?: string;
  "product-name"?: string;
  "console-name"?: string;
  "release-date"?: string;
  // Card grade prices (cents):
  "loose-price"?: number;        // raw / ungraded
  "cib-price"?: number;          // PSA 7 / 7.5
  "new-price"?: number;          // PSA 8 / 8.5
  "graded-price"?: number;       // PSA 9 / 9.5
  "box-only-price"?: number;     // PSA 9.5
  "manual-only-price"?: number;  // PSA 10
  "bgs-10-price"?: number;       // BGS 10
  "condition-17-price"?: number; // CGC 10
  // Other useful:
  "retail-loose-buy"?: number;
  "retail-loose-sell"?: number;
  asin?: string;
  upc?: string;
  "error-message"?: string;
}

export interface PCSearchResult {
  status: "success" | "error";
  products?: Array<{
    id: string;
    "product-name": string;
    "console-name": string;
  }>;
  "error-message"?: string;
}

async function get<T>(
  path: string,
  params: Record<string, string>
): Promise<T | null> {
  const tk = token();
  if (!tk) return null;
  const search = new URLSearchParams({ t: tk, ...params });
  const res = await fetch(`${BASE}${path}?${search.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`PriceCharting ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Search products by free-form query, optionally constrained to a console.
 * Returns top matches; first one is usually best.
 */
export async function searchProducts(
  query: string,
  consoleName?: string
): Promise<PCSearchResult["products"] | null> {
  const params: Record<string, string> = { q: query };
  if (consoleName) params["console-name"] = consoleName;
  const data = await get<PCSearchResult>("/api/products", params);
  if (!data || data.status !== "success") return null;
  return data.products ?? [];
}

/**
 * Fetch full pricing for a known product id.
 */
export async function getProduct(productId: string): Promise<PCProduct | null> {
  const data = await get<PCProduct>("/api/product", { id: productId });
  if (!data || data.status !== "success") return null;
  return data;
}

/**
 * Convert cents → dollars.
 */
export function toDollars(cents: number | undefined | null): number | null {
  if (!cents || cents <= 0) return null;
  return cents / 100;
}

/**
 * Extract every grade tier from a PCProduct as an array of {grade, priceUSD}.
 * Skips empty tiers.
 */
export function extractGrades(p: PCProduct): { grade: string; priceUsd: number }[] {
  const out: { grade: string; priceUsd: number }[] = [];
  const map: Array<[keyof PCProduct, string]> = [
    ["loose-price", "raw"],
    ["cib-price", "PSA7"],
    ["new-price", "PSA8"],
    ["graded-price", "PSA9"],
    ["box-only-price", "PSA9.5"],
    ["manual-only-price", "PSA10"],
    ["bgs-10-price", "BGS10"],
    ["condition-17-price", "CGC10"],
  ];
  for (const [key, grade] of map) {
    const usd = toDollars(p[key] as number | undefined);
    if (usd !== null) out.push({ grade, priceUsd: usd });
  }
  return out;
}

/**
 * Score how confident a search result is for a target card.
 * 0.0 (no match) → 1.0 (perfect)
 */
export function matchConfidence(
  target: { name: string; cardNumber?: string | null },
  candidate: { "product-name": string; "console-name": string }
): number {
  const t = target.name.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  const c = candidate["product-name"].toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  if (t === c) return 1.0;
  // Token overlap
  const tTokens = new Set(t.split(/\s+/).filter(Boolean));
  const cTokens = new Set(c.split(/\s+/).filter(Boolean));
  const overlap = Array.from(tTokens).filter((tok) => cTokens.has(tok)).length;
  let score = overlap / Math.max(tTokens.size, cTokens.size);
  // Boost if card number appears
  if (target.cardNumber && c.includes(target.cardNumber.toLowerCase())) {
    score = Math.min(1.0, score + 0.2);
  }
  return Number(score.toFixed(3));
}
