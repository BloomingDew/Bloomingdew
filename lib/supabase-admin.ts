import { createBrowserClient } from '@supabase/ssr';

// Cookie-based auth client — session readable server-side by middleware
export const supabaseAuth = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  await supabaseAuth.auth.signOut();
}

export async function getSession() {
  const { data } = await supabaseAuth.auth.getSession();
  return data.session;
}
