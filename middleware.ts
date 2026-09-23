import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // 1. Device Cookie Check
  const existingCookie = request.cookies.get('device');
  let device = 'desktop';
  if (!existingCookie) {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile =
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
        userAgent,
      );
    device = isMobile ? 'mobile' : 'desktop';
  } else {
    device = existingCookie.value;
  }
  if (!existingCookie || existingCookie.value !== device) {
    response.cookies.set('device', device, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // 2. Supabase Auth + RBAC
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const path = request.nextUrl.pathname;

    // Only fetch user on protected routes to prevent timeouts on public pages
    const isProtectedRoute =
      path.startsWith('/account') || path.startsWith('/admin') || path.startsWith('/checkout');

    if (isProtectedRoute) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Protect /account and /checkout routes
      if ((path.startsWith('/account') || path.startsWith('/checkout')) && !user) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(redirectUrl);
      }

      // Protect all /admin routes — require login first
      if (path.startsWith('/admin')) {
        if (!user) {
          const redirectUrl = new URL('/login', request.url);
          redirectUrl.searchParams.set('redirectTo', path);
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
