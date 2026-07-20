import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If the cookie is already set, respect it
  const existingCookie = request.cookies.get('device');

  let device = 'desktop';

  if (!existingCookie) {
    // Basic user-agent check for mobile devices
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile =
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
        userAgent,
      );
    device = isMobile ? 'mobile' : 'desktop';
  } else {
    device = existingCookie.value;
  }

  const response = NextResponse.next();

  // Set the cookie if it wasn't there, or refresh it
  if (!existingCookie || existingCookie.value !== device) {
    response.cookies.set('device', device, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
