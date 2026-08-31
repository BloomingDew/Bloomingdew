-- ============================================================================
-- Bloomingdew security lockdown — 004
--
-- WHY THIS EXISTS
--   A live audit found the public anon key (which ships in every page bundle)
--   can currently read, insert, update and DELETE the `orders` table, upload
--   and overwrite files in the product image bucket, and rewrite the email
--   templates sent to customers. Migration 001's RLS section was written but
--   never applied. This applies it, plus the pieces 001 deferred.
--
-- HOW TO RUN
--   Supabase dashboard -> SQL editor -> paste -> Run. Idempotent; safe to
--   re-run. Section A is safe with the current code and should be run NOW.
--   Section B must ship together with PR-<security> (it moves the admin reads
--   that currently use the anon key onto server routes); running B before that
--   deploys will break the admin enquiries / email-templates / uploads pages.
-- ============================================================================


-- helper: is the caller a signed-in admin?
create or replace function is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;


-- ══════════════════════════════════════════════════════════════════════════
-- SECTION A — SAFE TO RUN NOW (no code change needed)
-- ══════════════════════════════════════════════════════════════════════════

-- ORDERS — the critical one. Customers read only their own; admins read all;
-- NOBODY writes from the browser. Order creation already runs through the
-- service role (which bypasses RLS), so this changes nothing for real orders.
alter table orders enable row level security;
drop policy if exists orders_select_own on orders;
create policy orders_select_own on orders
  for select using (auth.uid() = user_id or is_admin());
-- No insert/update/delete policies => anon/authenticated writes are denied.

-- ADDRESSES / PROFILES / WISHLISTS — own rows only. Matches what the account
-- page already does; logged-in users are unaffected.
alter table addresses enable row level security;
drop policy if exists addresses_all_own on addresses;
create policy addresses_all_own on addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table profiles enable row level security;
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles
  for select using (auth.uid() = id or is_admin());
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = id);

alter table wishlists enable row level security;
drop policy if exists wishlists_all_own on wishlists;
create policy wishlists_all_own on wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PUBLIC STOREFRONT READ — everyone reads, only the service role writes.
alter table products enable row level security;
drop policy if exists products_public_read on products;
create policy products_public_read on products for select using (true);

alter table product_images enable row level security;
drop policy if exists product_images_public_read on product_images;
create policy product_images_public_read on product_images for select using (true);

alter table categories enable row level security;
drop policy if exists categories_public_read on categories;
create policy categories_public_read on categories for select using (true);

alter table product_colours enable row level security;
drop policy if exists product_colours_public_read on product_colours;
create policy product_colours_public_read on product_colours for select using (true);

alter table site_settings enable row level security;
drop policy if exists site_settings_public_read on site_settings;
create policy site_settings_public_read on site_settings for select using (true);

-- STORAGE — the product image bucket. Public read; writes only via the service
-- role. Admin uploads move to a server route in the accompanying PR; until that
-- deploys the admin media/product pages upload with the anon+user client and
-- WOULD break under this policy, so this block lives in Section B. Left here as
-- documentation of intent.


-- ══════════════════════════════════════════════════════════════════════════
-- SECTION B — RUN ONLY AFTER PR-<security> IS DEPLOYED
-- (that PR moves these tables' admin reads/writes and uploads to server routes)
-- ══════════════════════════════════════════════════════════════════════════

-- ENQUIRIES — public inserts happen via /api/enquiry (service role); reads are
-- admin-only via /api/admin/enquiries after the PR. Lock all browser access.
-- alter table enquiries enable row level security;
-- (no policies: anon/authenticated fully denied; service role bypasses)

-- EMAIL_TEMPLATES — currently anon-writable, which lets a stranger rewrite the
-- text emailed to every customer. Lock entirely; the admin editor moves to
-- /api/admin/email-templates.
-- alter table email_templates enable row level security;

-- CART_RESERVATIONS — the storefront writes these from the browser today. Until
-- reservation create/release moves to a server route, a locked table breaks
-- add-to-cart, so this waits for that change.
-- alter table cart_reservations enable row level security;

-- STORAGE bucket lockdown (run with the upload-route PR):
-- drop policy if exists "product-image public read" on storage.objects;
-- create policy "product-image public read" on storage.objects
--   for select using (bucket_id = 'product-image');
-- (no insert/update/delete policy => only the service role writes)
