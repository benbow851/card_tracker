import "server-only";

/**
 * Free FX rates from frankfurter.dev (ECB).
 * - No auth, no rate limit
 * - Updated daily (~16:00 CET)
 * - We cache server-side for 6h so we hit the upstream max ~4×/day
 */

type FxRates = {
  USD_THB: number;
  EUR_THB: number;
  USD_JPY: number;
  EUR_JPY: number;
  updatedAt: string;
};

const FALLBACK: FxRates = {
  USD_THB: 32.5,
  EUR_THB: 38.0,
  USD_JPY: 152,
  EUR_JPY: 178,
  updatedAt: new Date().toISOString(),
};

let cache: { rates: FxRates; expiresAt: number } | null = null;
const TTL_MS = 6 * 60 * 60 * 1000;

async function fetchPair(from: "USD" | "EUR"): Promise<{ THB: number; JPY: number }> {
  const res = await fetch(
    `https://api.frankfurter.dev/v1/latest?from=${from}&to=THB,JPY`,
    { next: { revalidate: 6 * 60 * 60 } }
  );
  if (!res.ok) throw new Error(`FX ${from} ${res.status}`);
  const data = (await res.json()) as { rates: { THB: number; JPY: number } };
  return data.rates;
}

export async function getRates(): Promise<FxRates> {
  if (cache && cache.expiresAt > Date.now()) return cache.rates;
  try {
    const [usd, eur] = await Promise.all([fetchPair("USD"), fetchPair("EUR")]);
    const rates: FxRates = {
      USD_THB: usd.THB,
      EUR_THB: eur.THB,
      USD_JPY: usd.JPY,
      EUR_JPY: eur.JPY,
      updatedAt: new Date().toISOString(),
    };
    cache = { rates, expiresAt: Date.now() + TTL_MS };
    return rates;
  } catch (err) {
    console.warn("[fx] using fallback rates:", err);
    return FALLBACK;
  }
}

export async function toThb(
  amount: number,
  currency: string
): Promise<number> {
  const c = (currency ?? "USD").toUpperCase();
  if (c === "THB") return amount;
  const rates = await getRates();
  if (c === "USD") return amount * rates.USD_THB;
  if (c === "EUR") return amount * rates.EUR_THB;
  return amount * rates.USD_THB;
}

export async function toJpy(
  amount: number,
  currency: string
): Promise<number> {
  const c = (currency ?? "USD").toUpperCase();
  if (c === "JPY") return amount;
  const rates = await getRates();
  if (c === "USD") return amount * rates.USD_JPY;
  if (c === "EUR") return amount * rates.EUR_JPY;
  return amount * rates.USD_JPY;
}

/**
 * One-shot: convert source amount → both THB + JPY in parallel.
 */
export async function toMulti(
  amount: number,
  currency: string
): Promise<{ thb: number; jpy: number; sourceCurrency: string; sourceAmount: number }> {
  const [thb, jpy] = await Promise.all([
    toThb(amount, currency),
    toJpy(amount, currency),
  ]);
  return { thb, jpy, sourceCurrency: currency.toUpperCase(), sourceAmount: amount };
}

/**
 * SYNC version of toMulti given pre-fetched rates.
 * Use this in tight loops to avoid N+1 await overhead.
 *
 *   const rates = await getRates();  // 1 fetch
 *   for (const item of items) {
 *     const m = convertSync(item.price, item.currency, rates);  // pure
 *   }
 */
export function convertSync(
  amount: number,
  currency: string,
  rates: { USD_THB: number; EUR_THB: number; USD_JPY: number; EUR_JPY: number }
): { thb: number; jpy: number; sourceCurrency: string; sourceAmount: number } {
  const c = (currency ?? "USD").toUpperCase();
  let thb: number, jpy: number;
  if (c === "THB") {
    thb = amount;
    jpy = (amount / rates.USD_THB) * rates.USD_JPY;
  } else if (c === "JPY") {
    thb = (amount / rates.USD_JPY) * rates.USD_THB;
    jpy = amount;
  } else if (c === "EUR") {
    thb = amount * rates.EUR_THB;
    jpy = amount * rates.EUR_JPY;
  } else {
    // default USD
    thb = amount * rates.USD_THB;
    jpy = amount * rates.USD_JPY;
  }
  return { thb, jpy, sourceCurrency: c, sourceAmount: amount };
}
