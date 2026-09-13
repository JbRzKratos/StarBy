import { NextResponse } from 'next/server';
import { getR2PublicUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    // Instantly generate the public CDN URL (no AWS SDK call needed)
    const publicUrl = getR2PublicUrl(key);

    // Redirect the browser/client directly to the Cloudflare CDN
    return NextResponse.redirect(publicUrl, 302);
  } catch (error) {
    console.error('Error generating public URL:', error);
    return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
  }
}
