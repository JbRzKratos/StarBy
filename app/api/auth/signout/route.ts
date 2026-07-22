import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login', request.url), { status: 302 });
  } catch {
    return NextResponse.redirect(new URL('/', request.url), { status: 302 });
  }
}
