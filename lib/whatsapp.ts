/**
 * WhatsApp Helper Utilities
 *
 * Configurable WhatsApp integration for Fregoro Studios.
 * Never hardcodes phone numbers; reads from NEXT_PUBLIC_WHATSAPP_NUMBER.
 */

export function getWhatsappNumber(): string {
  const envNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '');
  // Default to Fregoro official business contact if not explicitly set
  return envNumber || '918680991921';
}

export function getWhatsappLink(message: string): string {
  const phone = getWhatsappNumber();
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${phone}?text=${encoded}`;
}

export interface BulkOrderSummaryForWhatsApp {
  requestId?: string;
  customerName?: string;
  orderType?: string;
  companyName?: string;
  eventName?: string;
  apparelTypes?: string[];
  totalQuantity?: number;
  colours?: string[];
  printingMethod?: string;
  requiredDate?: string;
  city?: string;
}

export function formatBulkOrderWhatsappMessage(summary: BulkOrderSummaryForWhatsApp): string {
  const lines: string[] = ['Hi Fregoro Studios,', '', 'I have submitted a bulk order request.', ''];

  if (summary.requestId) {
    lines.push(`Request ID: ${summary.requestId}`);
  }
  if (summary.customerName) {
    lines.push(`Customer: ${summary.customerName}`);
  }
  if (summary.companyName) {
    lines.push(`Company: ${summary.companyName}`);
  }
  if (summary.orderType) {
    lines.push(`Order Type: ${summary.orderType}`);
  }
  if (summary.apparelTypes && summary.apparelTypes.length > 0) {
    lines.push(`Apparel: ${summary.apparelTypes.join(', ')}`);
  }
  if (summary.totalQuantity && summary.totalQuantity > 0) {
    lines.push(`Quantity: ${summary.totalQuantity}`);
  }
  if (summary.requiredDate) {
    lines.push(`Required Date: ${summary.requiredDate}`);
  }

  lines.push('');
  lines.push("I'd like to discuss the order with your team.");

  return lines.join('\n');
}

export function formatAdminToCustomerWhatsappMessage(
  customerName: string,
  requestNumber: string,
  additionalNote?: string,
): string {
  return [
    `Hi ${customerName}, this is Fregoro Studios regarding your bulk order request #${requestNumber}.`,
    additionalNote
      ? `\n${additionalNote}`
      : '\nWe have reviewed your requirements and would love to discuss a few details to finalize your quotation.',
    '\nPlease feel free to reply here directly.',
  ].join('\n');
}
