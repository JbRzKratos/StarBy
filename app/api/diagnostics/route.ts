import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envCheck = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    CASHFREE_APP_ID: Boolean(process.env.CASHFREE_APP_ID),
    CASHFREE_SECRET_KEY: Boolean(process.env.CASHFREE_SECRET_KEY),
    CASHFREE_ENVIRONMENT: process.env.CASHFREE_ENVIRONMENT || 'not_set (defaults to sandbox)',
    R2_ACCOUNT_ID: Boolean(process.env.R2_ACCOUNT_ID),
    R2_ACCESS_KEY_ID: Boolean(process.env.R2_ACCESS_KEY_ID),
    R2_SECRET_ACCESS_KEY: Boolean(process.env.R2_SECRET_ACCESS_KEY),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'not_set',
  };

  let dbStatus = 'untested';
  try {
    const userCount = await prisma.user.count();
    dbStatus = `connected (users: ${userCount})`;
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  let cashfreeStatus = 'untested';
  if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
    try {
      const baseUrl =
        process.env.CASHFREE_ENVIRONMENT === 'production'
          ? 'https://api.cashfree.com/pg'
          : 'https://sandbox.cashfree.com/pg';

      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID.trim(),
          'x-client-secret': process.env.CASHFREE_SECRET_KEY.trim(),
          'x-api-version': '2025-01-01',
        },
        body: JSON.stringify({
          order_id: 'HEALTH_' + Date.now(),
          order_amount: 1,
          order_currency: 'INR',
          customer_details: {
            customer_id: 'health_check',
            customer_phone: '9999999999',
          },
        }),
      });
      const data = await res.json();
      cashfreeStatus = res.ok
        ? 'connected & authenticated'
        : `api_error: ${data.message || JSON.stringify(data)}`;
    } catch (err) {
      cashfreeStatus = `fetch_error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    cashfreeStatus = 'missing_credentials';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    diagnostics: {
      database: dbStatus,
      cashfree: cashfreeStatus,
    },
  });
}
