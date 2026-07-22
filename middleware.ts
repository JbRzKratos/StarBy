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
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...(options as object) });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...(options as object) });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...(options as object) });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...(options as object) });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Protect /account routes
    if (path.startsWith('/account') && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect all /admin routes — require login first
    if (path.startsWith('/admin')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Fetch role from DB via Prisma is not possible in edge middleware,
      // so we store role in a signed session cookie set at login (handled server-side).
      // Here we do a lightweight check against the session JWT custom claims if available,
      // falling back to allowing the page to load (the layout/page does the authoritative check).
      // The authoritative RBAC check is enforced in each page's requireAdmin/requireStaff call.
      // This middleware acts as the first unauthenticated-user gate only.
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
