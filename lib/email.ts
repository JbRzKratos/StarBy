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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0E0E0F; color: #F5F1EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0E0E0F;">
            <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid rgba(245, 241, 234, 0.1);">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://fregorostudios.com'}" style="display: inline-block;">
                <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://fregorostudios.com'}/images/fregoro-logo.png" alt="Fregoro Studios" width="180" style="display: block; margin: 0 auto; max-width: 100%; height: auto;" onerror="this.style.display='none'" />
                <span style="font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #F5F1EA; text-decoration: none; display: block; margin-top: 10px;">FREGORO STUDIOS</span>
              </a>
            </div>
            
            <div style="padding: 40px 30px;">
              <h1 style="font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 15px;">Order Confirmed</h1>
              <p style="font-size: 15px; line-height: 1.6; color: rgba(245, 241, 234, 0.7); margin: 0 0 20px 0;">Hey ${safeName},</p>
              <p style="font-size: 15px; line-height: 1.6; color: rgba(245, 241, 234, 0.7); margin: 0 0 20px 0;">Thank you for choosing Fregoro Studios. Your order has been successfully placed and is now being processed by our team.</p>
              
              <div style="background-color: rgba(245, 241, 234, 0.03); border: 1px solid rgba(245, 241, 234, 0.1); border-radius: 12px; padding: 25px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px;">
                  <span style="color: rgba(245, 241, 234, 0.5);">Order Number</span>
                  <span style="color: #F5F1EA;">${safeOrderId}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px;">
                  <span style="color: rgba(245, 241, 234, 0.5);">Date</span>
                  <span style="color: #F5F1EA;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px;">
                  <span style="color: rgba(245, 241, 234, 0.5);">Payment Status</span>
                  <span style="color: #F5F1EA;">Paid</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid rgba(245, 241, 234, 0.1); font-weight: 600; font-size: 15px;">
                  <span style="color: rgba(245, 241, 234, 0.5);">Total Amount</span>
                  <span style="color: #F5F1EA;">₹${total.toFixed(2)}</span>
                </div>
              </div>
              
              <p style="font-size: 15px; line-height: 1.6; color: rgba(245, 241, 234, 0.7); margin: 0 0 20px 0;">We'll send you another email with tracking details as soon as your package ships.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://fregorostudios.com'}/account/orders/${safeOrderId}" style="display: inline-block; background-color: #F5F1EA; color: #0E0E0F; font-weight: 600; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-size: 14px;">View Order Status</a>
              </div>
            </div>
            
            <div style="padding: 30px; text-align: center; border-top: 1px solid rgba(245, 241, 234, 0.1); font-size: 13px; color: rgba(245, 241, 234, 0.4);">
              <p style="margin: 0 0 5px 0;">&copy; ${new Date().getFullYear()} Fregoro Studios. All rights reserved.</p>
              <p style="margin: 0;">If you have any questions, reply to this email or visit our help center.</p>
            </div>
          </div>
        </body>
        </html>
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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Notification</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0E0E0F; color: #F5F1EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0E0E0F;">
            <div style="padding: 30px 20px; border-bottom: 1px solid rgba(245, 241, 234, 0.1);">
              <span style="display: inline-block; background-color: #22c55e; color: #000; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 20px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Action Required</span>
              <h1 style="margin: 0; font-size: 24px; font-weight: 600;">New Order Received</h1>
            </div>
            
            <div style="padding: 40px 30px;">
              <p style="font-size: 15px; line-height: 1.6; color: rgba(245, 241, 234, 0.7); margin: 0 0 20px 0;">A new order has been successfully placed and paid for. Please review the details and begin processing.</p>
              
              <div style="background-color: rgba(245, 241, 234, 0.03); border: 1px solid rgba(245, 241, 234, 0.1); border-radius: 12px; padding: 25px; margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px;">
                  <span style="color: rgba(245, 241, 234, 0.5);">Order ID</span>
                  <span style="color: #F5F1EA; font-weight: 500; text-align: right;">${orderId}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px;">
                  <span style="color: rgba(245, 241, 234, 0.5);">Payment Status</span>
                  <span style="color: #22c55e; font-weight: 500; text-align: right;">Paid</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid rgba(245, 241, 234, 0.1); font-weight: 600; font-size: 15px; color: #22c55e;">
                  <span style="color: #22c55e;">Total Amount</span>
                  <span style="color: #F5F1EA; font-weight: 500; text-align: right;">₹${total.toFixed(2)}</span>
                </div>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://fregorostudios.com'}/admin/orders/${orderId}" style="display: block; background-color: #F5F1EA; color: #0E0E0F; font-weight: 600; text-decoration: none; padding: 16px 30px; border-radius: 8px; font-size: 15px; margin-top: 30px; text-align: center;">Open Order in Admin Panel</a>
            </div>
            
            <div style="padding: 30px; text-align: center; border-top: 1px solid rgba(245, 241, 234, 0.1); font-size: 13px; color: rgba(245, 241, 234, 0.4);">
              <p style="margin: 0;">Fregoro Studios Admin Automated Notification</p>
            </div>
          </div>
        </body>
        </html>
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
