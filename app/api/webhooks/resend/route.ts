import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function verifySvixSignature(
  rawBody: string,
  headers: { id: string; timestamp: string; signature: string },
  secret: string,
): boolean {
  try {
    const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const secretBytes = Buffer.from(cleanSecret, 'base64');
    const toSign = `${headers.id}.${headers.timestamp}.${rawBody}`;
    const expectedSig = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64');

    const passedSigs = headers.signature.split(' ');
    for (const item of passedSigs) {
      const [version, sig] = item.split(',');
      if (version === 'v1') {
        const sigBuf = Buffer.from(sig, 'utf8');
        const expectedBuf = Buffer.from(expectedSig, 'utf8');
        if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    console.error('[Resend Webhook] Error verifying Svix signature:', err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const svixId = request.headers.get('svix-id') || '';
    const svixTimestamp = request.headers.get('svix-timestamp') || '';
    const svixSignature = request.headers.get('svix-signature') || '';

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!svixId || !svixTimestamp || !svixSignature) {
        console.warn('[Resend Webhook] Missing Svix headers');
        return NextResponse.json({ error: 'Missing webhook headers' }, { status: 401 });
      }

      // Check timestamp freshness (within 5 minutes)
      const ts = parseInt(svixTimestamp, 10);
      if (!isNaN(ts)) {
        const nowSec = Math.floor(Date.now() / 1000);
        if (Math.abs(nowSec - ts) > 300) {
          console.warn('[Resend Webhook] Webhook timestamp outside 5-minute tolerance');
          return NextResponse.json({ error: 'Webhook timestamp expired' }, { status: 401 });
        }
      }

      const isValid = verifySvixSignature(
        rawBody,
        { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
        webhookSecret,
      );

      if (!isValid) {
        console.warn('[Resend Webhook] Invalid Svix signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = payload.type as string;
    const eventData = (payload.data || {}) as Record<string, unknown>;
    const emailId = (eventData.email_id || eventData.id) as string | undefined;

    console.log(`[Resend Webhook] Received ${eventType} for email: ${emailId}`);

    if (emailId) {
      let mappedStatus: 'sent' | 'delivered' | 'bounced' | 'failed' | 'pending' | null = null;
      let errorReason: string | null = null;

      switch (eventType) {
        case 'email.sent':
          mappedStatus = 'sent';
          break;
        case 'email.delivered':
          mappedStatus = 'delivered';
          break;
        case 'email.delivery_delayed':
          mappedStatus = 'pending';
          break;
        case 'email.bounced':
          mappedStatus = 'bounced';
          errorReason = JSON.stringify(eventData.bounce || 'Email bounced');
          break;
        case 'email.complained':
          mappedStatus = 'failed';
          errorReason = 'Recipient marked email as spam / complaint received';
          break;
        default:
          break;
      }

      if (mappedStatus) {
        // Update EmailEvent record
        const emailEvent = await prisma.emailEvent.findFirst({
          where: { providerMessageId: emailId },
        });

        if (emailEvent) {
          await prisma.emailEvent.update({
            where: { id: emailEvent.id },
            data: {
              status: mappedStatus,
              error: errorReason || emailEvent.error,
            },
          });

          // If linked to a contact submission or bulk order, we can also update if bounced/failed
          if (mappedStatus === 'bounced' || mappedStatus === 'failed') {
            console.warn(
              `[Resend Webhook] Email ${emailId} for request ${emailEvent.requestId} ${mappedStatus}: ${errorReason}`,
            );
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Resend Webhook] Handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing webhook' },
      { status: 500 },
    );
  }
}
