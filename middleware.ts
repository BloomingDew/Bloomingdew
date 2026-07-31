import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { COUNTRY_CURRENCY } from './lib/currency';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // --- Subdomain redirect ----------------------------------------------------
  // If someone hits bloomingdew.com/admin (or www.), redirect them to
  // admin.bloomingdew.com/admin so the admin always lives on its own subdomain.
  const isMainDomain = hostname === 'bloomingdew.com' || hostname === 'www.bloomingdew.com';
  if (isMainDomain && pathname.startsWith('/admin')) {
    return NextResponse.redirect(
      `https://admin.bloomingdew.com${pathname}${req.nextUrl.search}`,
      308,
    );
  }

  // --- Currency detection (all storefront requests) ---------------------------
  // Geo-derived currencies follow the visitor's location: set on first visit,
  // and refreshed whenever the detected country maps to a different currency
  // (travel, VPN, shared device). A currency the visitor picked by hand
  // (bd_currency_src=user, written by the client picker) is never overridden.
  // Unknown geo + no cookie -> leave unset; the client forces the picker.
  {
    const existing = req.cookies.get('bd_currency')?.value;
    const source = req.cookies.get('bd_currency_src')?.value;
    const country = (req.headers.get('x-vercel-ip-country') || '').toUpperCase();
    const geoCurrency = COUNTRY_CURRENCY[country];
    const cookieOpts = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const };

    if (geoCurrency && source !== 'user' && existing !== geoCurrency) {
      res.cookies.set('bd_currency', geoCurrency, cookieOpts);
      res.cookies.set('bd_currency_src', 'geo', cookieOpts);
    }
  }

  // --- Admin gate (only /admin, except /admin/login) --------------------------
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
  // Run on all routes except Next internals and static assets, so the currency
  // cookie is set on storefront page loads (and the admin gate still applies).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
