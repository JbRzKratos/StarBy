import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/auth-constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    let authUser: { id: string; email?: string } | null = null;

    // 1. Primary auth check: getUser()
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user && !error) {
        authUser = user;
      }
    } catch (userErr) {
      console.warn('[DesignerAuth API] getUser() check error, attempting session fallback:', userErr);
    }

    // 2. Resilient session fallback: getSession()
    if (!authUser) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          authUser = session.user;
        }
      } catch (sessionErr) {
        console.warn('[DesignerAuth API] getSession() fallback failed:', sessionErr);
      }
    }

    const email = authUser?.email?.trim().toLowerCase() || null;
    const isAuthorized = Boolean(
      email && (email === 'gokul30sep@gmail.com' || isSuperAdminEmail(email))
    );

    return NextResponse.json({
      authorized: isAuthorized,
      email: isAuthorized ? email : null,
    });
  } catch (err) {
    console.error('[DesignerAuth API] Unexpected error in designer-auth GET:', err);
    return NextResponse.json({ authorized: false, email: null }, { status: 200 });
  }
}
