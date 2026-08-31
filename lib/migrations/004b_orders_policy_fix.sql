-- ============================================================================
-- 004b — drop stray permissive policies, then lock properly
--
-- After 004 ran, the anon key could still SELECT and INSERT `orders`. That
-- means older, permissive policies (e.g. an "allow all" rule from early
-- development) still exist under names 004's `drop policy if exists` didn't
-- match. This drops EVERY policy on the sensitive tables and recreates only
-- the correct restrictive set.
--
-- Safe: order creation and all admin writes use the service role, which
-- bypasses RLS entirely. Customers keep read access to their own rows.
-- Idempotent; safe to re-run. Run in the Supabase SQL editor.
-- ============================================================================

create or replace function is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

do $$
declare
  t text;
  p record;
begin
  -- Wipe all existing policies on these tables so no stray permissive rule
  -- survives, then we rebuild the intended ones below.
  foreach t in array array['orders','addresses','profiles','wishlists'] loop
    for p in select policyname from pg_policies
             where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ORDERS — read own or admin; no client writes (service role bypasses RLS).
create policy orders_select_own on orders
  for select using (auth.uid() = user_id or is_admin());

-- ADDRESSES / PROFILES / WISHLISTS — own rows only.
create policy addresses_all_own on addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy profiles_select_own on profiles
  for select using (auth.uid() = id or is_admin());
create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = id);

create policy wishlists_all_own on wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
