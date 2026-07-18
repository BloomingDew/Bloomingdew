-- ============================================================================
-- Bloomingdew multi-currency migration
-- Base currency is now USD. Product prices are stored in USD; the app converts
-- to the visitor's local currency for display using fx_rates.
-- Run in the Supabase SQL editor.
-- ============================================================================

-- 1. Re-base all product prices to $50 USD (placeholder — adjust per product in
--    admin afterward). Discounts cleared so every item is a clean $50 to start.
update products set price = 50, discount = 0;

-- 2. FX rate table: how many units of <currency> equal 1 USD.
--    is_manual = true  -> the daily auto-refresh SKIPS this row (e.g. NGN, where
--    the official rate lags the real market rate and you want to set it yourself).
create table if not exists fx_rates (
  currency     text primary key,
  rate_vs_usd  numeric not null check (rate_vs_usd > 0),
  is_manual    boolean not null default false,
  updated_at   timestamptz not null default now()
);

-- Public read (storefront needs rates to display prices); writes only via the
-- service role used by the refresh cron. RLS on + no write policy => client writes denied.
alter table fx_rates enable row level security;
drop policy if exists "fx_rates_public_read" on fx_rates;
create policy "fx_rates_public_read" on fx_rates for select using (true);

-- 3. Seed a starter set so prices render before the first cron run.
--    (The daily cron overwrites all non-manual rows with live rates.)
insert into fx_rates (currency, rate_vs_usd, is_manual) values
  ('USD', 1,       false),
  ('GBP', 0.7438,  false),
  ('EUR', 0.86,    false),
  ('NGN', 1600,    true),   -- MANUAL: set to the rate you actually price at (official API ~1380 is unrealistically low)
  ('GHS', 11.57,   false),
  ('KES', 129.33,  false),
  ('ZAR', 18.0,    false),
  ('CAD', 1.37,    false),
  ('AUD', 1.50,    false)
on conflict (currency) do nothing;
