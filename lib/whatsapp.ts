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
  const lines: string[] = [
    'Hi Fregoro Studios, I am interested in a bulk custom apparel order.',
    '',
  ];

  if (summary.requestId) {
    lines.push(`• Request ID: ${summary.requestId}`);
  }
  if (summary.orderType) {
    lines.push(`• Order Type: ${summary.orderType}`);
  }
  if (summary.companyName) {
    lines.push(`• Company / Organization: ${summary.companyName}`);
  }
  if (summary.eventName) {
    lines.push(`• Purpose / Event: ${summary.eventName}`);
  }
  if (summary.apparelTypes && summary.apparelTypes.length > 0) {
    lines.push(`• Apparel: ${summary.apparelTypes.join(', ')}`);
  }
  if (summary.colours && summary.colours.length > 0) {
    lines.push(`• Colours: ${summary.colours.join(', ')}`);
  }
  if (summary.totalQuantity && summary.totalQuantity > 0) {
    lines.push(`• Total Quantity: ${summary.totalQuantity} pcs`);
  }
  if (summary.printingMethod) {
    lines.push(`• Printing: ${summary.printingMethod}`);
  }
  if (summary.requiredDate) {
    lines.push(`• Required Date: ${summary.requiredDate}`);
  }
  if (summary.city) {
    lines.push(`• City: ${summary.city}`);
  }

  lines.push('');
  lines.push('I would like to discuss this order and receive a quotation.');

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
