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

    const path = request.nextUrl.pathname;
    
    // Only fetch user on protected routes to prevent timeouts on public pages
    const isProtectedRoute = path.startsWith('/account') || path.startsWith('/admin');

    if (isProtectedRoute) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Protect /account routes
      if (path.startsWith('/account') && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Protect all /admin routes — require login first
      if (path.startsWith('/admin')) {
        if (!user) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
