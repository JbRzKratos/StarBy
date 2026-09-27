/**
 * Fregoro Studios Central Email Subsystem
 *
 * Single import point for all email services, templates, configuration, and helpers.
 */

export * from './emailConfig';
export * from './emailTemplates';
export * from './emailService';

// Legacy / Existing E-Commerce Order Email Functions
export {
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  type OrderEmailDetails,
  type OrderItemEmailData,
  type ShippingAddressEmailData,
} from '../email';
