-- ============================================================================
-- pending_orders — order context stashed at PaymentIntent creation so the
-- Stripe webhook (or a 3DS redirect return) can finalize an order even when the
-- client-side success callback never runs.
--
-- Run in the Supabase SQL editor. Required for the Stripe webhook to work.
-- ============================================================================

create table if not exists pending_orders (
  payment_intent_id text primary key,
  items jsonb not null,
  shipping jsonb not null,
  user_id uuid references auth.users(id) on delete set null,
  subtotal numeric(12,2),
  created_at timestamptz default now()
);

-- Lock it down: RLS on, no policies → only the service role (server routes /
-- webhook) can read or write. The anon/authenticated roles get nothing.
alter table pending_orders enable row level security;

-- Optional housekeeping: pending rows are deleted on successful finalize, but a
-- periodic cleanup of abandoned intents keeps the table tidy. Run manually or
-- schedule with pg_cron:
--   delete from pending_orders where created_at < now() - interval '3 days';
