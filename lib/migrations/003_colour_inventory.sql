-- ============================================================================
-- Bloomingdew: per-colour inventory
-- Run in the Supabase SQL editor BEFORE deploying.
--
-- Stock becomes (product, colour, size) instead of (product, size), so each
-- colourway has its own counter. colour_id IS NULL means "product has no
-- colours" — existing rows keep working untouched.
-- ============================================================================

-- ── 1. Inventory gets a colour ──────────────────────────────────────────────
alter table product_size_inventory
  add column if not exists colour_id uuid references product_colours(id) on delete cascade;

-- Replace the old (product_id, size) uniqueness with a colour-aware one.
-- Two partial indexes because NULL never equals NULL in a unique constraint.
alter table product_size_inventory drop constraint if exists product_size_inventory_product_id_size_key;
drop index if exists product_size_inventory_product_id_size_key;

create unique index if not exists psi_product_size_nocolour_idx
  on product_size_inventory (product_id, size)
  where colour_id is null;

create unique index if not exists psi_product_colour_size_idx
  on product_size_inventory (product_id, colour_id, size)
  where colour_id is not null;

-- ── 2. Reservations get a colour ────────────────────────────────────────────
alter table cart_reservations
  add column if not exists colour_id uuid references product_colours(id) on delete cascade;

-- ── 3. Stock movements get a colour (audit trail) ───────────────────────────
alter table inventory_movements
  add column if not exists colour_id uuid references product_colours(id) on delete set null;

-- ── 4. Colour-aware availability function ───────────────────────────────────
-- Available = stocked quantity minus live (unexpired) reservations, for that
-- exact product+colour+size. Pass p_colour_id = null for colourless products.
create or replace function get_available_stock_v2(
  p_product_id bigint,
  p_size text,
  p_colour_id uuid default null
)
returns integer
language sql
stable
as $$
  select greatest(
    0,
    coalesce((
      select quantity from product_size_inventory
      where product_id = p_product_id
        and size = p_size
        and colour_id is not distinct from p_colour_id
      limit 1
    ), 0)
    -
    coalesce((
      select sum(quantity) from cart_reservations
      where product_id = p_product_id
        and size = p_size
        and colour_id is not distinct from p_colour_id
        and expires_at > now()
    ), 0)
  )::integer;
$$;

-- ── 5. Keep products.stock_quantity in sync (admin list "Stock" column) ─────
-- Total across every colour and size, so the products table still shows a
-- meaningful overall number.
create or replace function refresh_product_stock_total(p_product_id bigint)
returns void
language sql
as $$
  update products
  set stock_quantity = coalesce((
    select sum(quantity) from product_size_inventory where product_id = p_product_id
  ), 0)
  where id = p_product_id;
$$;
