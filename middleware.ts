import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser() verifies the JWT with Supabase; getSession() only reads the cookie.
  const { data: { user } } = await supabase.auth.getUser();

  const redirectToLogin = () => {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  };

  if (!user) return redirectToLogin();

  // Authentication is not enough — the user must be a registered admin.
  // Checked against the locked-down `admins` table via the service role.
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: adminRow } = await service
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    // Authenticated but not an admin — deny.
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
