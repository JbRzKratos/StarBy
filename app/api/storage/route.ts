import { NextResponse } from 'next/server';
import { generatePresignedDownloadUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    const { downloadUrl } = await generatePresignedDownloadUrl(key, 3600); // 1 hour expiry

    // Redirect the browser/client directly to the secure R2 URL
    return NextResponse.redirect(downloadUrl, 302);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
  }
}
