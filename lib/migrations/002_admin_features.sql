-- ============================================================================
-- Bloomingdew admin upgrade migration
-- Run this in the Supabase SQL editor BEFORE deploying the admin upgrade.
-- Everything here is service-role-only (RLS enabled, no client policies),
-- matching the pattern from 001_security.sql — all reads/writes go through
-- the authenticated /api/admin routes.
-- ============================================================================

-- 1. Persisted Best Sellers ordering (homepage featured section)
alter table products add column if not exists featured_position int;

-- 2. Discount codes
create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'fixed')),
  value numeric not null check (value > 0),
  min_subtotal numeric default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses int,
  use_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table discount_codes enable row level security;

-- 3. Collections / drops
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  launch_at timestamptz,
  active boolean not null default false,
  created_at timestamptz default now()
);
create table if not exists collection_products (
  collection_id uuid references collections(id) on delete cascade,
  product_id bigint references products(id) on delete cascade,
  position int not null default 0,
  primary key (collection_id, product_id)
);
alter table collections enable row level security;
alter table collection_products enable row level security;

-- 4. Abandoned checkout capture
create table if not exists abandoned_checkouts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  items jsonb not null,
  subtotal numeric not null default 0,
  status text not null default 'started' check (status in ('started', 'recovered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table abandoned_checkouts enable row level security;

-- 5. Inventory movements audit trail
create table if not exists inventory_movements (
  id bigint generated always as identity primary key,
  product_id bigint references products(id) on delete cascade,
  size text not null,
  delta int not null,
  reason text not null,          -- 'manual-adjust' | 'sale' | 'restock' | ...
  admin_email text,
  created_at timestamptz default now()
);
alter table inventory_movements enable row level security;

-- 6. Admin roles (owner = full access, staff = no product/settings writes)
alter table admins add column if not exists role text not null default 'owner'
  check (role in ('owner', 'staff'));

-- 7. Activity log
create table if not exists activity_log (
  id bigint generated always as identity primary key,
  admin_email text,
  action text not null,          -- 'create' | 'update' | 'delete' | 'status' | ...
  entity text not null,          -- 'product' | 'order' | 'discount' | ...
  entity_id text,
  details jsonb,
  created_at timestamptz default now()
);
alter table activity_log enable row level security;

-- 8. Discount fields on orders
alter table orders add column if not exists discount_code text;
alter table orders add column if not exists discount_usd numeric;
