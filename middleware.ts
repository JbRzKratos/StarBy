import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Block direct public access to raw master design artwork paths
  if (request.nextUrl.pathname.startsWith('/t_shirt_designs')) {
    return new NextResponse('Access Denied: Direct access to original print artwork is restricted.', {
      status: 403,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // Forward current pathname in request headers so Server Components can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  requestHeaders.set('x-url', request.url);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
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
  const shouldSetDeviceCookie = !existingCookie || existingCookie.value !== device;

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
            request,
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
      let authUser = null;
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (user && !authError) {
          authUser = user;
        }
      } catch (err) {
        console.warn('[Middleware] getUser error:', err);
      }

      // Fallback to getSession() if getUser() encountered token refresh or network glitch
      if (!authUser) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            authUser = session.user;
          }
        } catch (err) {
          console.warn('[Middleware] getSession fallback error:', err);
        }
      }

      // Protect /account and /checkout routes
      if ((path.startsWith('/account') || path.startsWith('/checkout')) && !authUser) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(redirectUrl);
      }

      // Protect all /admin routes — require login first
      if (path.startsWith('/admin') && !authUser) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  if (shouldSetDeviceCookie) {
    response.cookies.set('device', device, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static files, JS chunks, CSS)
     *  - _next/image   (Next.js image optimizer)
     *  - favicon.ico
     *  - Static asset directories proxied to R2
     *  - The Vite clothing mockup tool
     *  - Common static file extensions (fonts, images, etc.)
     *
     * Auth + device-cookie middleware only runs on HTML page routes,
     * not on asset requests — avoiding unnecessary edge CPU and preventing
     * Set-Cookie headers that would break CDN cache-ability of assets.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|site\\.webmanifest|images|3d-assets|tools/clothing-mockup|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|eot|otf|mp4|webm|ogg|mp3|wav)).*)',
  ],
};
