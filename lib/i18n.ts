/**
 * Lightweight i18n. Locale read from `NEXT_PUBLIC_LOCALE` env or defaulted to th-en.
 * For full localization, swap to next-intl when needed.
 */

export const T = {
  // Nav
  oneePiece: { en: "One Piece", th: "วันพีซ" },
  pokemon: { en: "Pokémon", th: "โปเกมอน" },
  yugioh: { en: "Yu-Gi-Oh!", th: "ยูกิโอ" },
  naruto: { en: "Naruto", th: "นารูโตะ" },
  magic: { en: "Magic", th: "เมจิก" },

  // Hero
  realtimeAnalytics: {
    en: "Real-time Market Analytics",
    th: "ราคาตลาดเรียลไทม์",
  },
  globalAuthority: {
    en: "The Global TCG Authority.",
    th: "ฐานข้อมูลราคา TCG ระดับโลก",
  },
  initSearch: { en: "Initialize Search", th: "เริ่มค้นหา" },
  viewLiveTrends: { en: "View Live Trends", th: "ดูเทรนด์สด" },

  // Browse
  cards: { en: "card", th: "ใบ" },
  cardsPlural: { en: "cards", th: "ใบ" },
  searchPlaceholder: {
    en: "Search by name, set, number...",
    th: "ค้นหาด้วยชื่อ ชุดการ์ด เลข...",
  },
  filtersClear: { en: "Clear all filters", th: "ล้างตัวกรอง" },
  noResults: {
    en: "No cards matched your filters",
    th: "ไม่พบการ์ดที่ตรงกับเงื่อนไข",
  },
  resetFilters: { en: "Reset filters", th: "รีเซ็ตตัวกรอง" },

  // Card detail
  marketFloor: { en: "Market Floor", th: "ราคาตลาดต่ำสุด" },
  change24h: { en: "24h Change", th: "เปลี่ยนแปลง 24 ชม." },
  weeklyTrend: { en: "Weekly Trend", th: "เทรนด์รายสัปดาห์" },
  pricePerformance: { en: "Price Performance", th: "ประสิทธิภาพราคา" },
  cardSpecifications: { en: "Card Specifications", th: "คุณสมบัติของการ์ด" },
  ability: { en: "Ability", th: "ความสามารถ" },
  subTypes: { en: "Sub-types", th: "คุณสมบัติย่อย" },
  liveMarket: { en: "Live Market Aggregator", th: "ราคากลางจากแหล่งต่างๆ" },
  trackAsset: { en: "Track Asset", th: "ติดตามการ์ด" },
  share: { en: "Share", th: "แชร์" },

  // Spec labels
  cardType: { en: "Card Type", th: "ประเภท" },
  rarity: { en: "Rarity", th: "ความหายาก" },
  cost: { en: "Cost", th: "ค่าใช้" },
  power: { en: "Power", th: "พาวเวอร์" },
  life: { en: "Life", th: "ไลฟ์" },
  counter: { en: "Counter", th: "เคาน์เตอร์" },
  set: { en: "Set", th: "ชุดการ์ด" },
  year: { en: "Year", th: "ปี" },
  finish: { en: "Finish", th: "พื้นผิว" },
  language: { en: "Language", th: "ภาษา" },

  // Sentiment
  bullish: { en: "Bullish", th: "ขาขึ้น" },
  bearish: { en: "Bearish", th: "ขาลง" },
  neutral: { en: "Neutral", th: "คงที่" },
} as const;

export type Locale = "en" | "th";
export type TKey = keyof typeof T;

export function getLocale(): Locale {
  return (process.env.NEXT_PUBLIC_LOCALE as Locale) ?? "th";
}

/**
 * Translate a key. Falls back to English when Thai isn't available.
 */
export function t(key: TKey, locale: Locale = getLocale()): string {
  const entry = T[key];
  return entry[locale] ?? entry.en;
}

/**
 * Bilingual string for situations where we want both languages shown.
 */
export function tt(key: TKey): string {
  const entry = T[key];
  return `${entry.th} · ${entry.en}`;
}
