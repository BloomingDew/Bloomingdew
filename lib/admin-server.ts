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
    // The role column may not exist yet (002 migration not applied) —
    // fall back to the plain membership check rather than locking admins out.
    const { data: fallback } = await supabaseService
      .from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    return fallback ? { user, role: 'owner' } : null;
  }
  if (!data) return null;
  return { user, role: (data.role === 'staff' ? 'staff' : 'owner') };
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}
