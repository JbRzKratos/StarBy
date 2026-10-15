import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  let userEmail = '';

  try {
    const supabase = createClient();

    if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error && data?.user?.email) {
        userEmail = data.user.email;
      }
    } else if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user?.email) {
        userEmail = data.user.email;
      }
    } else {
      // Check if session exists already
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email;
      }
    }
  } catch (err) {
    console.warn('[AuthConfirm] Error exchanging token:', err);
  }

  // Construct redirect URL to /login with verified indicator
  const redirectUrl = new URL('/login', request.url);
  redirectUrl.searchParams.set('verified', 'true');
  if (userEmail) {
    redirectUrl.searchParams.set('email', userEmail);
  }
  if (next && next.startsWith('/')) {
    redirectUrl.searchParams.set('redirectTo', next);
  }

  return NextResponse.redirect(redirectUrl);
}
