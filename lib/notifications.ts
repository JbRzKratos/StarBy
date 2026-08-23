/**
 * Notification Service Abstraction
 * Decouples order lifecycle business events from concrete delivery channels (Email, SMS, WhatsApp).
 */

import {
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendContactEmail,
  sendContactAutoReply,
} from './email';

export type NotificationEvent =
  | 'ORDER_CREATED'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_PRINTING'
  | 'ORDER_PACKED'
  | 'ORDER_SHIPPED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED';

export interface NotificationPayload {
  orderId: string;
  publicOrderId?: string | null | undefined;
  customerName: string;
  customerEmail?: string | null | undefined;
  customerPhone?: string | null | undefined;
  total?: number | undefined;
  trackingNumber?: string | null | undefined;
  trackingUrl?: string | null | undefined;
  carrier?: string | null | undefined;
  customMessage?: string | null | undefined;
}

export interface NotificationResult {
  channel: 'email' | 'sms' | 'whatsapp';
  success: boolean;
  recipient: string;
  error?: string;
}

/**
 * Dispatch an order lifecycle notification to all configured channels.
 */
export async function dispatchNotification(
  event: NotificationEvent,
  payload: NotificationPayload,
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  const displayOrderId = payload.publicOrderId || payload.orderId;

  try {
    switch (event) {
      case 'ORDER_CREATED':
      case 'PAYMENT_CONFIRMED': {
        if (payload.customerEmail) {
          const sent = await sendOrderConfirmationEmail(
            payload.customerEmail,
            displayOrderId,
            payload.customerName,
            payload.total || 0,
          );
          results.push({
            channel: 'email',
            success: sent,
            recipient: payload.customerEmail,
          });
        }

        // Notify Admin of new paid order
        const adminSent = await sendAdminNewOrderEmail(displayOrderId, payload.total || 0);
        results.push({
          channel: 'email',
          success: adminSent,
          recipient: process.env.ADMIN_EMAIL || 'admin@starby.in',
        });
        break;
      }

      case 'ORDER_SHIPPED': {
        if (payload.customerEmail) {
          const sent = await sendOrderShippedEmail(
            payload.customerEmail,
            displayOrderId,
            payload.customerName,
            payload.trackingUrl || undefined,
            payload.trackingNumber || undefined,
            payload.carrier || undefined,
          );
          results.push({
            channel: 'email',
            success: sent,
            recipient: payload.customerEmail,
          });
        }
        break;
      }

      case 'ORDER_DELIVERED': {
        if (payload.customerEmail) {
          const sent = await sendOrderDeliveredEmail(
            payload.customerEmail,
            displayOrderId,
            payload.customerName,
          );
          results.push({
            channel: 'email',
            success: sent,
            recipient: payload.customerEmail,
          });
        }
        break;
      }

      default:
        // Other events (PRINTING, PACKED) logged for audit
        console.log(`[Notification Service] Event "${event}" recorded for order ${displayOrderId}`);
        break;
    }
  } catch (err) {
    console.error(`[Notification Service] Dispatch failed for ${event}:`, err);
    results.push({
      channel: 'email',
      success: false,
      recipient: payload.customerEmail || 'unknown',
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}

export { sendContactEmail, sendContactAutoReply };
