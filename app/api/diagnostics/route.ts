import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

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
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'not_set',
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'not_set',
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    EMAIL_FROM: process.env.EMAIL_FROM || 'not_set',
    NEXT_PUBLIC_TAWKTO_PROPERTY_ID: Boolean(process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID),
    NEXT_PUBLIC_TAWKTO_WIDGET_ID: Boolean(process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'not_set',
  };

  // 1. Database Check
  let dbStatus = 'untested';
  try {
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    dbStatus = `connected (users: ${userCount}, products: ${productCount})`;
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 2. Supabase Auth Check
  let authStatus = 'untested';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      });
      authStatus = res.ok ? 'connected & authenticated' : `auth_error: HTTP ${res.status}`;
    } catch (err) {
      authStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    authStatus = 'missing_credentials';
  }

  // 3. Cashfree Payments Check
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

  // 4. Cloudflare R2 Check
  let r2Status = 'untested';
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
    try {
      const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET_NAME || 'fregorostudios',
          MaxKeys: 1,
        }),
      );
      r2Status = `connected & authenticated (${list.KeyCount ?? 0} sample objects found)`;
    } catch (err) {
      r2Status = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    r2Status = 'missing_credentials';
  }

  // 5. Resend Email Check
  let emailStatus = 'untested';
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const domains: Array<{ name: string; status: string }> = data.data || [];
        const domainNames = domains.map((d) => `${d.name} (${d.status})`).join(', ');
        emailStatus = `connected & authenticated (domains: ${domainNames || 'none'})`;
      } else {
        emailStatus = `api_error: HTTP ${res.status}`;
      }
    } catch (err) {
      emailStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    emailStatus = 'missing_credentials';
  }

  // 6. Tawk.to Live Chat Check
  let chatStatus = 'untested';
  if (process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID && process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID) {
    try {
      const res = await fetch(
        `https://embed.tawk.to/${process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID}/${process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID}`,
      );
      chatStatus = res.ok ? 'connected & active' : `status_error: HTTP ${res.status}`;
    } catch (err) {
      chatStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    chatStatus = 'missing_credentials';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    diagnostics: {
      database: dbStatus,
      auth: authStatus,
      cashfree: cashfreeStatus,
      r2_storage: r2Status,
      email: emailStatus,
      live_chat: chatStatus,
    },
  });
}
