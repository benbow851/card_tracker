-- ============================================================
-- Card Price Tracker - Supabase Schema
-- Paste this whole file into Supabase → SQL Editor → Run
-- ============================================================

-- Extensions (uuid-ossp ships preinstalled on Supabase, gen_random_uuid is built-in)
create extension if not exists "pgcrypto";


-- ============================================================
-- 1. CARDS
-- ============================================================
create table if not exists public.cards (
  id              uuid primary key default gen_random_uuid(),
  name            varchar(255) not null,
  card_number     varchar(50),
  set_name        varchar(255),
  set_code        varchar(50),
  rarity          varchar(100),
  image_url       text,
  category        varchar(50) not null,           -- 'one-piece' | 'pokemon' | 'naruto' | ...
  series          varchar(255),
  language        varchar(50),
  finish          varchar(100),
  year            integer,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_cards_name      on public.cards (name);
create index if not exists idx_cards_set_code  on public.cards (set_code);
create index if not exists idx_cards_category  on public.cards (category);
create index if not exists idx_cards_rarity    on public.cards (rarity);


-- ============================================================
-- 2. PRICES (raw observations - one row per scrape)
-- ============================================================
create table if not exists public.prices (
  id            uuid primary key default gen_random_uuid(),
  card_id       uuid not null references public.cards(id) on delete cascade,
  source        varchar(50) not null,             -- 'ebay' | 'tcgplayer' | 'cardmarket' | 'user'
  price         numeric(12,2) not null,
  currency      varchar(10) not null default 'USD',
  condition     varchar(50),                      -- 'raw' | 'psa-10' | 'cgc-9.5' | ...
  listing_url   text,
  recorded_at   timestamptz not null default now()
);

create index if not exists idx_prices_card    on public.prices (card_id);
create index if not exists idx_prices_date    on public.prices (recorded_at desc);
create index if not exists idx_prices_source  on public.prices (source);


-- ============================================================
-- 3. PRICE_HISTORY (daily aggregate - what charts read)
-- ============================================================
create table if not exists public.price_history (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.cards(id) on delete cascade,
  date        date not null,
  source      varchar(50) not null,
  avg_price   numeric(12,2) not null,
  min_price   numeric(12,2) not null,
  max_price   numeric(12,2) not null,
  volume      integer not null default 0,
  unique (card_id, date, source)
);

create index if not exists idx_history_card_date on public.price_history (card_id, date desc);


-- ============================================================
-- 4. COLLECTIONS (Phase 2 - user-owned cards)
-- ============================================================
create table if not exists public.collections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  card_id         uuid not null references public.cards(id) on delete cascade,
  quantity        integer not null default 1,
  purchase_price  numeric(12,2),
  purchase_date   date,
  condition       varchar(50),
  created_at      timestamptz not null default now()
);

create index if not exists idx_collections_user on public.collections (user_id);
create index if not exists idx_collections_card on public.collections (card_id);


-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_cards_updated_at on public.cards;
create trigger trg_cards_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();


-- ============================================================
-- 6. ROW LEVEL SECURITY
-- Public can READ cards/prices/history. Only service_role can WRITE.
-- Collections: each user reads/writes their own only.
-- ============================================================
alter table public.cards         enable row level security;
alter table public.prices        enable row level security;
alter table public.price_history enable row level security;
alter table public.collections   enable row level security;

-- Public read on catalog + price data
drop policy if exists "cards readable by anyone"   on public.cards;
create policy "cards readable by anyone"
  on public.cards for select using (true);

drop policy if exists "prices readable by anyone"  on public.prices;
create policy "prices readable by anyone"
  on public.prices for select using (true);

drop policy if exists "history readable by anyone" on public.price_history;
create policy "history readable by anyone"
  on public.price_history for select using (true);

-- Collections are private per user
drop policy if exists "users see their own collection" on public.collections;
create policy "users see their own collection"
  on public.collections for select using (auth.uid() = user_id);

drop policy if exists "users insert into their own collection" on public.collections;
create policy "users insert into their own collection"
  on public.collections for insert with check (auth.uid() = user_id);

drop policy if exists "users update their own collection" on public.collections;
create policy "users update their own collection"
  on public.collections for update using (auth.uid() = user_id);

drop policy if exists "users delete from their own collection" on public.collections;
create policy "users delete from their own collection"
  on public.collections for delete using (auth.uid() = user_id);


-- ============================================================
-- 7. SEED (optional - sample One Piece cards to verify)
-- Comment out if you'd rather seed from the app
-- ============================================================
insert into public.cards (name, card_number, set_name, set_code, rarity, category, series, language, finish, year, description, image_url)
values
  ('Monkey.D.Luffy (SEC-Parallel)', 'OP05-119', 'OP-05 Awakening of the New Era', 'OP-05', 'SEC Parallel', 'one-piece', 'One Piece TCG', 'Japanese', 'Holo Refractor', 2024, 'Gear 5 Joyboy parallel.', null),
  ('Charizard 1st Edition Shadowless', 'BS-004', 'Base Set', 'BS', 'Holo Rare', 'pokemon', 'Pokémon TCG', 'English', 'Holographic', 1999, '1999 Wizards of the Coast Shadowless.', null),
  ('Blue-Eyes White Dragon', 'LOB-001', 'Legend of Blue Eyes White Dragon', 'LOB', 'Ultra Rare', 'yu-gi-oh', 'Yu-Gi-Oh!', 'English', 'Foil', 2002, 'First print North American Ultra Rare.', null)
on conflict do nothing;
