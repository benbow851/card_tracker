/**
 * Yuyu-Tei (遊々亭) HTML scraper.
 * https://yuyu-tei.jp — major Japanese TCG retailer; the de-facto reference
 * price for the Thai market when buying JP-language cards.
 *
 * No public API → we parse the per-set listing pages.
 *
 * Robots.txt is permissive (no general disallow). We:
 *  - Add User-Agent identifying the project
 *  - Rate-limit to 2-3 sec between requests
 *  - Cache aggressively (1 fetch per set per day max)
 *  - Show "Source: Yuyu-Tei" attribution in UI
 *
 * URL pattern:
 *   Set listing:  /sell/opc/s/{setCode}      e.g. /sell/opc/s/op01
 *   Card detail:  /sell/opc/card/{set}/{id}  e.g. /sell/opc/card/op01/10001
 *
 * Game codes: opc=One Piece, ws=Weiss Schwarz (we currently only target opc)
 */
import * as cheerio from "cheerio";

const BASE = "https://yuyu-tei.jp";

const USER_AGENT =
  "CardTracker/0.1 (+https://card-tracker.vercel.app; respectful scraper)";

export interface YuyuTeiCard {
  /** External card code, e.g. "OP01-001" */
  code: string;
  /** Rarity hint from alt text, e.g. "L", "P-L", "SR", "P-SR" */
  rarityHint: string | null;
  /** Japanese name */
  nameJP: string | null;
  /** Price in JPY (yen) */
  priceJPY: number;
  /** Yuyu-Tei internal product id (used for variant disambiguation) */
  internalId: string;
  /** Direct image URL on Yuyu-Tei CDN */
  imageUrl: string | null;
  /** True if marked out of stock */
  outOfStock: boolean;
}

/**
 * Convert an OPTCG-style set code (e.g. "OP-01") to Yuyu-Tei format ("op01").
 */
export function setCodeToYuyutei(setCode: string): string {
  return setCode.toLowerCase().replace(/-/g, "");
}

/**
 * Fetch + parse a Yuyu-Tei set listing page. Returns one row per card variant
 * (a single card code may yield multiple rows for raw / parallel / etc).
 */
export async function fetchSetPrices(
  setCode: string,
  game: "opc" = "opc"
): Promise<YuyuTeiCard[]> {
  const ytSet = setCodeToYuyutei(setCode);
  const url = `${BASE}/sell/${game}/s/${ytSet}`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Yuyu-Tei ${res.status} on ${ytSet}`);
  }
  const html = await res.text();
  return parseSetHtml(html, game);
}

export function parseSetHtml(html: string, game: "opc"): YuyuTeiCard[] {
  const $ = cheerio.load(html);
  const cards: YuyuTeiCard[] = [];

  // Each card sits in a container that has:
  //   <a href="/sell/opc/card/op01/10001"> ... <img alt="OP01-001 L Name"> ...
  //   <span class="...border-dark...">OP01-001</span>
  //   <h4 class="text-primary fw-bold">Name JP</h4>
  //   <strong class="text-end">120 円</strong>
  $(`a[href*="/sell/${game}/card/"]`).each((_, anchor) => {
    const href = $(anchor).attr("href");
    if (!href) return;

    // Parse internal id from href
    const m = href.match(new RegExp(`/sell/${game}/card/([^/]+)/(\\d+)`));
    if (!m) return;
    const internalId = m[2];

    // Find nearest enclosing card row — the parent container
    const card = $(anchor).closest("li, .card-product, .card-list-item, div");
    let rowHtml = card.html() ?? "";
    if (rowHtml.length < 50) {
      // Fallback: walk up until we find one with surrounding code/price text
      rowHtml = $(anchor).parent().parent().html() ?? rowHtml;
    }

    // Extract image alt — most reliable source for code + rarity + name
    const img = $(anchor).find("img").first();
    const alt = img.attr("alt") ?? "";
    // alt format: "OP01-001 L ロロノア・ゾロ" or "OP01-001 P-L ロロノア・ゾロ(パラレル)"
    const altMatch = alt.match(/^([A-Z]+\d+-\d+)\s+(P?-?[A-Z]+(?:-[A-Z]+)?)\s+(.+)$/);
    let code: string | null = null;
    let rarityHint: string | null = null;
    let nameJP: string | null = null;
    if (altMatch) {
      code = altMatch[1];
      rarityHint = altMatch[2];
      nameJP = altMatch[3];
    }

    if (!code) return;

    const imageUrl = img.attr("src") ?? null;

    // Price: nearest <strong> with "X 円"
    // Use the document path — cheerio scoping is tricky for siblings, so
    // we walk up to find the row container and look inside it.
    let priceJPY = 0;
    let outOfStock = false;
    const rowContainer = $(anchor).closest("div").parent();
    rowContainer.find("strong").each((_, s) => {
      const txt = $(s).text().trim();
      const pm = txt.match(/([0-9,]+)\s*円/);
      if (pm && priceJPY === 0) {
        priceJPY = parseInt(pm[1].replace(/,/g, ""), 10);
      }
      if (/品切/.test(txt) || /SOLD\s*OUT/i.test(txt)) outOfStock = true;
    });

    // Skip rows where we couldn't pull a price (probably promo banner)
    if (priceJPY === 0 && !outOfStock) return;

    cards.push({
      code,
      rarityHint,
      nameJP,
      priceJPY,
      internalId,
      imageUrl,
      outOfStock,
    });
  });

  // De-dup: each card seems to appear twice in HTML (image link + name link
  // both share the same internal id) — keep first.
  const seen = new Set<string>();
  return cards.filter((c) => {
    if (seen.has(c.internalId)) return false;
    seen.add(c.internalId);
    return true;
  });
}

/**
 * Pick the canonical (cheapest non-zero) price among Yuyu-Tei variants of
 * the same card code. We use this to populate the primary `prices` row;
 * variants stay separate as multiple rows for users who want detail.
 */
export function pickCanonical(rows: YuyuTeiCard[]): YuyuTeiCard | null {
  const priced = rows.filter((r) => r.priceJPY > 0 && !r.outOfStock);
  if (priced.length === 0) return null;
  return priced.reduce((a, b) => (a.priceJPY <= b.priceJPY ? a : b));
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
