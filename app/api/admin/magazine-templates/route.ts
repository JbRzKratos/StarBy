import { NextResponse } from 'next/server';
import { MAGAZINE_TEMPLATES } from '@/data/magazineTemplates';

// Magazine templates are served from local static data (backed by R2 assets).
// No database needed — the DB is only for user/order/auth data.

export async function GET() {
  return NextResponse.json(MAGAZINE_TEMPLATES, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
