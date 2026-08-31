// NOTE: This module must only be imported from server code (route handlers,
// server components, middleware). It uses the service-role key.
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. NEVER import this into a client component.
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Returns the currently authenticated user only if they are a registered admin.
// Uses getUser() (which verifies the JWT with Supabase) rather than getSession()
// (which only reads the cookie), and checks membership in the locked-down
// `admins` table via the service role so the check can't be bypassed client-side.
// The verified auth-user id for the current request, or null for a guest.
// Checkout must derive user_id from this — never from the request body — so an
// attacker can't attribute an order (or inject a saved address) to a victim's
// account by posting someone else's uuid.
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getAdminUser(): Promise<User | null> {
  return (await getAdmin())?.user ?? null;
}

export type AdminRole = 'owner' | 'staff';

// Like getAdminUser but includes the role from the admins table.
// 'owner' = full access; 'staff' = day-to-day (orders/enquiries) but no
// destructive or settings-level writes.
export async function getAdmin(): Promise<{ user: User; role: AdminRole } | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabaseService
    .from('admins')
    .select('user_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    // Fail CLOSED. A transient DB error must not silently promote a staff admin
    // to owner (bypassing the owner-only gates). The role column has existed
    // since migration 002; if the query genuinely errors, deny.
    console.error('[getAdmin] role lookup failed — denying:', error.message);
    return null;
  }
  if (!data) return null;
  return { user, role: (data.role === 'staff' ? 'staff' : 'owner') };
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}
