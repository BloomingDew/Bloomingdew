-- ============================================================================
-- Bloomingdew security migration
-- Run this in the Supabase SQL editor (or via the CLI) in order.
--
-- WHAT THIS DOES
--   1. Creates a locked-down `admins` table that the app's new admin gate
--      checks. Until you add yourself here, /admin will (correctly) reject you.
--   2. Adds Row Level Security policies so the public anon key can no longer
--      read other customers' orders/addresses/profiles or write privileged data.
--
-- IMPORTANT ORDER OF OPERATIONS
--   - Section 1 is REQUIRED now: the new middleware checks the `admins` table,
--     so admin login is blocked until you insert your admin user id.
--   - Section 2 (RLS) assumes admin data access goes through the service-role
--     server routes. `orders` INSERT already does (see /api/orders/create).
--     Admin READS of orders/enquiries/inventory still run through the browser
--     anon client today, so DO NOT enable those table locks until those reads
--     are moved to server routes (tracked as the next follow-up). The orders
--     and own-row customer policies below are safe to apply immediately.
-- ============================================================================


-- ── 1. ADMINS TABLE (apply now) ─────────────────────────────────────────────
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Lock it down: enable RLS and add NO policies, so neither the anon nor the
-- authenticated (customer) role can read or modify it. Only the service-role
-- key (used by middleware + admin server routes) bypasses RLS.
alter table admins enable row level security;

-- Add yourself as an admin. Find your user id in Supabase → Authentication → Users.
--   insert into admins (user_id) values ('<your-auth-user-uuid>');


-- ── 2. ROW LEVEL SECURITY (review notes above before applying) ──────────────

-- helper: is the current request an admin? (used by admin-readable policies)
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ORDERS — customers may read only their own; nobody writes via the client.
alter table orders enable row level security;

drop policy if exists "orders_select_own" on orders;
create policy "orders_select_own" on orders
  for select using (auth.uid() = user_id or is_admin());

-- No insert/update/delete policies for anon/authenticated => those are denied.
-- Order creation runs through the service role (/api/orders/create); admin
-- status updates should move to a service-role route before relying on this.

-- ADDRESSES — own rows only.
alter table addresses enable row level security;

drop policy if exists "addresses_all_own" on addresses;
create policy "addresses_all_own" on addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PROFILES — own row only (admins may read all).
alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id or is_admin());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- WISHLISTS — own rows only.
alter table wishlists enable row level security;

drop policy if exists "wishlists_all_own" on wishlists;
create policy "wishlists_all_own" on wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PUBLIC STOREFRONT READ — products, images, categories, site settings.
-- Read for everyone; writes only via service-role admin routes.
alter table products enable row level security;
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products for select using (true);

alter table product_images enable row level security;
drop policy if exists "product_images_public_read" on product_images;
create policy "product_images_public_read" on product_images for select using (true);

alter table categories enable row level security;
drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories for select using (true);

-- site_settings: public read (homepage content), writes via /api/admin/site-settings.
alter table site_settings enable row level security;
drop policy if exists "site_settings_public_read" on site_settings;
create policy "site_settings_public_read" on site_settings for select using (true);

-- ENQUIRIES — write-only for the public (insert via /api/enquiry which uses the
-- service role); reads only for admins. Do NOT enable until the admin enquiries
-- page reads through a service-role route.
-- alter table enquiries enable row level security;
-- drop policy if exists "enquiries_admin_read" on enquiries;
-- create policy "enquiries_admin_read" on enquiries for select using (is_admin());

-- email_templates, product_size_inventory, cart_reservations, orders UPDATE:
-- lock these once their admin reads/writes are moved to service-role routes.
