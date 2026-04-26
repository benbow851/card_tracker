// OPTCG API client — One Piece TCG card + price data.
// Docs: https://www.optcgapi.com/documentation
// Free, no auth, no documented rate limit (be reasonable).

const BASE = "https://optcgapi.com/api";

export interface OptcgSet {
  set_name: string;
  set_id: string;
}

export interface OptcgCard {
  inventory_price: number | null;
  market_price: number | null;
  card_name: string;
  set_name: string;
  card_text: string | null;
  set_id: string;
  rarity: string | null;
  card_set_id: string;       // e.g. "OP05-091"
  card_color: string | null;
  card_type: string | null;
  life: string | null;
  card_cost: string | null;
  card_power: string | null;
  sub_types: string | null;
  counter_amount: number | null;
  attribute: string | null;
  date_scraped: string;
  card_image_id: string;
  card_image: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`OPTCG API ${res.status} on ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function listSets(): Promise<OptcgSet[]> {
  return getJson<OptcgSet[]>("/allSets/");
}

export async function getSetCards(setId: string): Promise<OptcgCard[]> {
  return getJson<OptcgCard[]>(`/sets/${setId}/`);
}

export async function listAllCards(): Promise<OptcgCard[]> {
  return getJson<OptcgCard[]>("/allSetCards/");
}
