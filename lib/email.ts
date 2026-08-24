import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

/** Prevent XSS by escaping HTML special characters in user-supplied strings */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendOrderConfirmationEmail(
  toEmail: string,
  orderId: string,
  customerName: string,
  total: number,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping order confirmation email to:', toEmail);
    return false;
  }

  const safeName = escapeHtml(customerName);
  const safeOrderId = escapeHtml(orderId);

  try {
    const fromAddress = process.env.EMAIL_FROM || 'Fregoro Studios <orders@fregorostudios.com>';
    await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Order Confirmation - ${safeOrderId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">Thank you for your order, ${safeName}!</h2>
          <p>We've received your order <strong>${safeOrderId}</strong> and are getting it ready for you.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p style="margin: 0;"><strong>Order ID:</strong> ${safeOrderId}</p>
            <p style="margin: 0;"><strong>Total:</strong> ₹${total.toFixed(2)}</p>
          </div>
          <p>You can track the status of your order on our website or by logging into your account.</p>
          <br />
          <p>Best regards,<br/>The Fregoro Studios Team</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

export async function sendContactEmail(
  name: string,
  email: string,
  subject: string,
  message: string,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping contact email from:', email);
    return false;
  }

  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  try {
    await resend.emails.send({
      from: 'Fregoro Studios Contact <contact@fregorostudios.com>',
      to: ['admin@fregorostudios.com'],
      replyTo: email,
      subject: `New Contact: ${safeSubject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return false;
  }
}

export async function sendContactAutoReply(toEmail: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping auto-reply to:', toEmail);
    return false;
  }

  const safeName = escapeHtml(name);

  try {
    await resend.emails.send({
      from: 'Fregoro Studios Support <support@fregorostudios.com>',
      to: [toEmail],
      subject: 'We got your message — Fregoro Studios Support',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">Hey ${safeName}, we received your message!</h2>
          <p>Thanks for reaching out to Fregoro Studios. Our team will get back to you within 24–48 hours.</p>
          <p>In the meantime, you can browse our collection or check your order status at <a href="https://fregoro.vercel.app" style="color: #0057FF;">fregorostudios.com</a>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 13px;">If you didn't submit this form, you can ignore this email.</p>
          <p>– The Fregoro Studios Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send contact auto-reply:', error);
    return false;
  }
}

export async function sendAdminNewOrderEmail(orderId: string, total: number) {
  if (!process.env.RESEND_API_KEY) return false;

  try {
    const fromAddress =
      process.env.EMAIL_FROM || 'Fregoro Studios Orders <orders@fregorostudios.com>';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fregorostudios.com';
    await resend.emails.send({
      from: fromAddress,
      to: [adminEmail],
      subject: `New Order Received - ${orderId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">New Order Alert 🚨</h2>
          <p>You have received a new order <strong>${orderId}</strong> for ₹${total.toFixed(2)}.</p>
          <p>Log in to the <a href="/admin/orders">Admin Panel</a> to process it.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send admin order email:', error);
    return false;
  }
}

export async function sendOrderShippedEmail(
  toEmail: string,
  orderId: string,
  customerName: string,
  trackingUrl?: string,
  trackingNumber?: string,
  carrier?: string,
) {
  if (!process.env.RESEND_API_KEY) return false;
  const safeName = escapeHtml(customerName);

  try {
    const fromAddress =
      process.env.EMAIL_FROM || 'Fregoro Studios Updates <updates@fregorostudios.com>';
    await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Your Order ${orderId} has Shipped! 🚚`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">Great news, ${safeName}!</h2>
          <p>Your order <strong>${orderId}</strong> has been shipped and is on its way to you.</p>
          ${
            trackingUrl || trackingNumber
              ? `
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Tracking Details</h3>
              ${carrier ? `<p style="margin: 0;"><strong>Carrier:</strong> ${escapeHtml(carrier)}</p>` : ''}
              ${trackingNumber ? `<p style="margin: 0;"><strong>Tracking Number:</strong> ${escapeHtml(trackingNumber)}</p>` : ''}
              ${trackingUrl ? `<p style="margin-top: 10px;"><a href="${escapeHtml(trackingUrl)}" style="background-color: #3B5EFF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Your Order</a></p>` : ''}
            </div>
          `
              : ''
          }
          <p>Thank you for shopping with us!</p>
          <br />
          <p>Best regards,<br/>The Fregoro Studios Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send order shipped email:', error);
    return false;
  }
}

export async function sendOrderDeliveredEmail(
  toEmail: string,
  orderId: string,
  customerName: string,
) {
  if (!process.env.RESEND_API_KEY) return false;
  const safeName = escapeHtml(customerName);

  try {
    const fromAddress =
      process.env.EMAIL_FROM || 'Fregoro Studios Updates <updates@fregorostudios.com>';
    await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Your Order ${orderId} has been Delivered! 🎉`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">Your order has arrived, ${safeName}!</h2>
          <p>Your order <strong>${orderId}</strong> has been marked as delivered.</p>
          <p>We hope you love your purchase! If you have any questions or concerns, please contact our support team.</p>
          <br />
          <p>Best regards,<br/>The Fregoro Studios Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send order delivered email:', error);
    return false;
  }
}
