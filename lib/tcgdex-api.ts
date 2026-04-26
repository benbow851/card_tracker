// TCGdex API client — Pokemon TCG card + price data.
// Docs: https://tcgdex.dev/
// Free, no auth.

const BASE = "https://api.tcgdex.net/v2/en";

export interface TcgdexSetSummary {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount: { total: number; official: number };
}

export interface TcgdexSet extends TcgdexSetSummary {
  cards: { id: string; localId: string; name: string; image?: string }[];
}

export interface TcgdexCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
  rarity?: string;
  illustrator?: string;
  category?: string;
  hp?: number;
  types?: string[];
  set: { id: string; name: string };
  variants?: Record<string, boolean>;
  pricing?: {
    cardmarket?: {
      updated: string;
      unit: string;
      avg: number | null;
      low: number | null;
      trend: number | null;
      avg1: number | null;
      avg7: number | null;
      avg30: number | null;
    } | null;
    tcgplayer?: unknown;
  };
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`TCGdex ${res.status} on ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function listSets(): Promise<TcgdexSetSummary[]> {
  return getJson<TcgdexSetSummary[]>("/sets");
}

export async function getSet(setId: string): Promise<TcgdexSet> {
  return getJson<TcgdexSet>(`/sets/${setId}`);
}

export async function getCard(cardId: string): Promise<TcgdexCard> {
  return getJson<TcgdexCard>(`/cards/${cardId}`);
}
