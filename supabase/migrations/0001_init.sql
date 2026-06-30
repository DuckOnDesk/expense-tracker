-- Expense tracker initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) for a new project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  color text not null default '#6b7280',
  icon text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12, 2) not null check (amount >= 0),
  merchant text not null,
  memo text,
  payment_method text,
  occurred_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual', 'notification')),
  raw_notification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc);
create index if not exists transactions_user_merchant_idx
  on public.transactions (user_id, merchant);

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- merchant_category_map
-- learned mapping from merchant name -> category, used for auto-classification
-- ---------------------------------------------------------------------------
create table if not exists public.merchant_category_map (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  merchant text not null,
  category_id uuid not null references public.categories (id) on delete cascade,
  match_count int not null default 1,
  updated_at timestamptz not null default now(),
  unique (user_id, merchant)
);

alter table public.merchant_category_map enable row level security;

create policy "merchant_map_select_own" on public.merchant_category_map
  for select using (auth.uid() = user_id);
create policy "merchant_map_insert_own" on public.merchant_category_map
  for insert with check (auth.uid() = user_id);
create policy "merchant_map_update_own" on public.merchant_category_map
  for update using (auth.uid() = user_id);
create policy "merchant_map_delete_own" on public.merchant_category_map
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- budgets
-- ---------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  month date not null, -- first day of the budget month, e.g. 2026-06-01
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

alter table public.budgets enable row level security;

create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- seed default categories for a new user
-- call this once after signup (see src/lib/seedCategories.ts), or rely on the
-- app's first-login bootstrap.
-- ---------------------------------------------------------------------------
