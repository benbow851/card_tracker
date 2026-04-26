# Card Price Tracker · The Digital Vault

Real-time TCG price tracking — One Piece, Pokémon, and growing — with prices in
**฿THB** + **¥JPY** + raw + graded (PSA / BGS / CGC).

Built with Next.js 14 + Supabase + Prisma + Recharts.

---

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | ISR + static prerender top 200 |
| DB | Supabase Postgres | Pooler (IPv4, port 6543) |
| ORM | Prisma 6 | append-only writes |
| FX | frankfurter.dev | USD/EUR → THB + JPY, 6h cache |
| Charts | Recharts (lazy-loaded) | dynamic import, 0 KB in entry bundle |
| Hosting | Vercel | Hobby tier ok |

## Data sources

| Source | Game | Currency | Grade |
|---|---|---|---|
| [optcgapi.com](https://optcgapi.com) | One Piece | USD | raw |
| [tcgdex.dev](https://tcgdex.dev) | Pokémon | EUR | raw |
| [pricecharting.com](https://www.pricecharting.com/api-documentation) | All TCGs | USD | raw + PSA/BGS/CGC |
| [eBay Browse API](https://developer.ebay.com) | All | USD | raw + PSA/BGS/CGC (parsed from titles) |

## Local development

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# Edit .env.local — see "Environment variables" below

# 3. Generate Prisma client
npx prisma generate

# 4. Dev server
npm run dev
```

## Environment variables

```env
# Supabase (REQUIRED)
DATABASE_URL="postgresql://postgres.{project-ref}:{password}@aws-1-{region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
SUPABASE_URL="https://{project-ref}.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://{project-ref}.supabase.co"

# App URL (for OG images, sitemap, metadata)
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# Cron auth (REQUIRED — long random string)
CRON_SECRET=""

# Optional: PriceCharting (paid, $8-49/mo)
PRICECHARTING_TOKEN=""

# Optional: eBay Browse API (free with developer account)
EBAY_CLIENT_ID=""
EBAY_CLIENT_SECRET=""
```

## Vercel deploy

1. Push repo to GitHub
2. Import on [vercel.com/new](https://vercel.com/new)
3. Add **all env vars** above in Project Settings → Environment Variables
4. Set Build Command: `prisma generate && next build` (Vercel auto-detects)
5. Deploy

### Cron jobs (auto-configured via `vercel.json`)

| Path | Schedule (UTC) | Purpose |
|---|---|---|
| `/api/cron/update-prices?source=optcg` | `0 20 * * *` (03:00 BKK) | Refresh One Piece prices, full catalog |
| `/api/cron/update-prices?source=rotating&batch=30` | `0 * * * *` (every hour) | Rotates through tcgdex / pricecharting / ebay / pc-mapping based on hour |

Hobby tier limit: 2 cron jobs ✅

## Performance

| Metric | Result |
|---|---|
| First Load JS (entry) | **101 KB** |
| Detail page bundle | **103 KB** |
| Static prerender | Top 200 cards |
| ISR revalidate | 60s (browse) / 300s (detail) / 3600s (sitemap) |
| Recharts | Lazy-loaded (not in entry) |
| Image optimization | `unoptimized: true` (free tier safe) |
| FX queries | 1 per page (was N+1) |

## Architecture

```
┌─ User → Vercel Edge (cached HTML)
│        ↓
│        Next.js SSG/ISR
│        ↓
│        Supabase Postgres (pooler 6543, IPv4)
│
└─ Vercel Cron (UTC) → /api/cron/update-prices
                          ↓
                     lib/jobs.ts (append-only INSERT)
                          ↓
                     Supabase (no row locks → user reads unaffected)
```

## Status & monitoring

- **Public health**: `GET /api/status` → counts + cron progress
- **Manual trigger**: `GET /api/cron/update-prices?source=optcg`
  (with `Authorization: Bearer $CRON_SECRET` if set)

## Database schema

See [`prisma/schema.prisma`](./prisma/schema.prisma):

- `cards` — TCG card catalog (with OPTCG fields + PriceCharting mapping)
- `prices` — Append-only price observations (per grade, per source)
- `price_history` — Daily aggregate (avg/min/max + volume)
- `sets` — Set catalog
- `update_jobs` — Cursor-based job state
- `collections` — User collections (Phase 2 / RLS-protected)

## Project structure

```
app/
  cards/[id]/         Card detail (ISR + JSON-LD + OG image)
  cards/page.tsx      Browse (filters + pagination + JPY/THB)
  sets/[id]/          Set view grouped by rarity
  api/cron/...        Scheduled jobs
  api/status/         Public health + job progress
  sitemap.ts          Dynamic sitemap (all cards)
  robots.ts           SEO

components/
  cards/              CardSpecs, GradedPriceTable, PriceChart, etc.
  layout/             Header, Footer, Ticker, MobileNav

lib/
  prisma.ts           Singleton Prisma client
  fx.ts               USD/EUR→THB+JPY (cached 6h)
  queries.ts          Server-only DB helpers
  jobs.ts             refreshOptcg/Tcgdex/PriceCharting/eBay
  optcg-api.ts        One Piece API client
  tcgdex-api.ts       Pokémon API client
  pricecharting-api.ts  PriceCharting client + match scoring
  ebay-api.ts         eBay Browse API client + OAuth
  matching.ts         Title parsing, grade extraction, robust mean

scripts/
  seed-optcg.ts       Initial One Piece seed (~2,000 cards)
  seed-pokemon.ts     Initial Pokémon seed (~2,000 cards)
  seed-base1.ts       Re-seed for Pokemon Base Set
```

## License

MIT — built with [Claude Code](https://www.anthropic.com/claude-code).
