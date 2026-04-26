export type Category =
  | "one-piece"
  | "naruto"
  | "pokemon"
  | "yu-gi-oh"
  | "magic"
  | "dragon-ball";

export interface Card {
  id: string;
  name: string;
  cardNumber: string;
  setName: string;
  setCode: string;
  rarity: string;
  category: Category;
  imageUrl: string;
  description?: string;
  language?: string;
  finish?: string;
  year?: number;
  series?: string;
  // OPTCG-specific fields
  cardColor?: string;
  cardType?: string;
  cardCost?: string;
  cardPower?: string;
  subTypes?: string;
  attribute?: string;
  counterAmount?: number;
  life?: string;
  cardText?: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface PriceData {
  cardId: string;
  current: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
  weeklyTrend: "Bullish" | "Bearish" | "Neutral";
  history: PricePoint[];
  sources: PriceSource[];
}

export interface PriceSource {
  name: string;
  short: string;
  price: number;
  currency: string;
  note: string;
  highlight?: boolean;
}

export interface TrendingCard extends Card {
  price: number;            // THB
  priceJpy?: number;        // JPY (for comparison)
  sourcePrice?: number;     // raw source price (USD or EUR)
  sourceCurrency?: string;  // 'USD' | 'EUR' | 'JPY'
  changePercent: number;
}

export interface SeriesIndex {
  category: Category;
  name: string;
  setsTracked: number;
  trend: number;
  badge?: string;
  description: string;
  imageUrl: string;
}
