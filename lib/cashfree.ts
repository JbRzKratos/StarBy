/**
 * Cashfree Payments — Server-side API client
 *
 * Uses Cashfree REST API (v2025-01-01) directly via fetch.
 * No external SDK dependency — fully edge-compatible (Cloudflare Workers).
 *
 * NEVER import this file from client-side code.
 */

// ─── Configuration ──────────────────────────────────────────────────────────

const CASHFREE_API_VERSION = '2025-01-01';

function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
  const rawEnv = process.env.CASHFREE_ENVIRONMENT?.trim().toLowerCase();

  if (!appId || !secretKey) {
    throw new Error(
      'Cashfree credentials missing in environment variables. Please configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your Vercel Project Settings.',
    );
  }

  // If credentials start with TEST, force sandbox regardless of typos in CASHFREE_ENVIRONMENT
  const isTestKey = appId.startsWith('TEST');
  const environment: 'sandbox' | 'production' =
    isTestKey || rawEnv === 'sandbox'
      ? 'sandbox'
      : rawEnv === 'production'
        ? 'production'
        : 'sandbox';

  const baseUrl =
    environment === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

  return { appId, secretKey, baseUrl, environment };
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CashfreeOrderRequest {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone: string;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
  order_note?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: string;
  payment_session_id: string;
  order_amount: number;
  order_currency: string;
}

export interface CashfreePaymentStatus {
  cf_order_id: string;
  order_id: string;
  order_status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'TERMINATED';
  order_amount: number;
  order_currency: string;
}

// ─── Create Order ───────────────────────────────────────────────────────────

export async function createCashfreeOrder(
  orderData: CashfreeOrderRequest,
): Promise<CashfreeOrderResponse> {
  const { appId, secretKey, baseUrl } = getCashfreeConfig();

  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': CASHFREE_API_VERSION,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cashfree order creation failed:', response.status, errorText);
    throw new Error(`Cashfree API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<CashfreeOrderResponse>;
}

// ─── Get Order Status (Server-side verification) ────────────────────────────

export async function getCashfreeOrderStatus(orderId: string): Promise<CashfreePaymentStatus> {
  const { appId, secretKey, baseUrl } = getCashfreeConfig();

  const response = await fetch(`${baseUrl}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': CASHFREE_API_VERSION,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cashfree order status check failed ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<CashfreePaymentStatus>;
}

// ─── Webhook Signature Verification ─────────────────────────────────────────
// Cashfree signs webhooks with HMAC-SHA256 using your secret key.
// The signature is sent in the `x-webhook-signature` header.
// The signed payload is the raw request body.
// Reference: https://www.cashfree.com/docs/payments/online/webhooks

export async function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
): Promise<boolean> {
  const { secretKey } = getCashfreeConfig();

  // Cashfree webhook signature: HMAC-SHA256 of (timestamp + rawBody)
  const signedPayload = timestamp + rawBody;

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(signedPayload),
  );

  const expectedSignature = Buffer.from(signatureBuffer).toString('base64');

  // Constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== signature.length) return false;

  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return result === 0;
}

// ─── Generate Public Order ID ───────────────────────────────────────────────

export function generatePublicOrderId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000); // 5-digit random
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3-char alpha
  return `STB-${year}-${random}${suffix}`;
}

// ─── Get Cashfree Environment Info (safe for client) ────────────────────────

export function getCashfreeEnvironment(): 'sandbox' | 'production' {
  return (process.env.CASHFREE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
}
