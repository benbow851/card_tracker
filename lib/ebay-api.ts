/**
 * eBay Browse API client.
 * Docs: https://developer.ebay.com/api-docs/buy/browse/overview.html
 *
 * Auth flow:
 *  - OAuth 2.0 client_credentials grant
 *  - Token cached in module memory for ~1.5h (eBay tokens last 2h)
 *  - Without EBAY_CLIENT_ID / EBAY_CLIENT_SECRET, all calls return null
 *    so the rest of the app keeps working.
 *
 * Why we use eBay:
 *  - Free (5,000 calls/day on application keys)
 *  - Has graded prices (PSA / BGS / CGC) parseable from sold listing titles
 *  - Real market prices (sold = paid, not asking)
 */

const BASE = "https://api.ebay.com/buy/browse/v1";
const OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SCOPE = "https://api.ebay.com/oauth/api_scope";

let cachedToken: { value: string; expiresAt: number } | null = null;

export function isConfigured(): boolean {
  return !!process.env.EBAY_CLIENT_ID && !!process.env.EBAY_CLIENT_SECRET;
}

/**
 * Get a fresh app-level OAuth token. Caches for ~1.5h.
 */
async function getAccessToken(): Promise<string | null> {
  if (!isConfigured()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const id = process.env.EBAY_CLIENT_ID!;
  const secret = process.env.EBAY_CLIENT_SECRET!;
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(SCOPE)}`,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`eBay OAuth ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 600) * 1000, // refresh 10min early
  };
  return cachedToken.value;
}

export interface EbayItemSummary {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  itemWebUrl: string;
  itemEndDate?: string;
  condition?: string;
  conditionId?: string;
  buyingOptions?: string[];
}

export interface EbaySearchResponse {
  itemSummaries?: EbayItemSummary[];
  total?: number;
  warnings?: { message: string }[];
}

/**
 * Search current listings (active items).
 */
export async function searchActive(
  query: string,
  options: { limit?: number; categoryId?: string } = {}
): Promise<EbaySearchResponse | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const params = new URLSearchParams({
    q: query,
    limit: String(options.limit ?? 50),
  });
  if (options.categoryId) params.set("category_ids", options.categoryId);

  const res = await fetch(`${BASE}/item_summary/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`eBay search ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<EbaySearchResponse>;
}

/**
 * Search SOLD/COMPLETED listings. eBay's filter syntax:
 *   filter=conditions:{1000}|sold:1|deliveryCountry:US
 *
 * NOTE: True sold-listings search requires the "Trading API" (Finding API
 * deprecated). For the free-tier Browse API we approximate with current
 * listings; for true sold data, upgrade to Marketplace Insights API.
 */
export async function searchSold(
  query: string,
  options: { limit?: number } = {}
): Promise<EbaySearchResponse | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const params = new URLSearchParams({
    q: query,
    limit: String(options.limit ?? 50),
    sort: "endTimeSoonest",
  });

  const res = await fetch(`${BASE}/item_summary/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`eBay sold search ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<EbaySearchResponse>;
}

/**
 * Build a targeted query string for a card with a specific grade.
 * Examples:
 *   buildGradedQuery({ name: "Charizard", externalId: "BS-004" }, "PSA10")
 *   → "Charizard BS-004 PSA 10"
 */
export function buildGradedQuery(
  card: { name: string; externalId?: string | null; setCode?: string | null },
  grade?: string
): string {
  const parts: string[] = [card.name.replace(/\([^)]*\)/g, "").trim()];
  if (card.externalId) parts.push(card.externalId);
  else if (card.setCode) parts.push(card.setCode);
  if (grade && grade !== "raw") {
    // "PSA10" -> "PSA 10"
    parts.push(grade.replace(/(PSA|BGS|CGC)(\d+(\.\d)?)/i, "$1 $2"));
  }
  return parts.join(" ");
}
