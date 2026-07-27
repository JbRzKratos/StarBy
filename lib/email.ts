import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

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

  try {
    const data = await resend.emails.send({
      from: 'StarBy Orders <orders@starby.in>',
      to: [toEmail],
      subject: `Order Confirmation - ${orderId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">Thank you for your order, ${customerName}!</h2>
          <p>We've received your order <strong>${orderId}</strong> and are getting it ready for you.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p style="margin: 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 0;"><strong>Total:</strong> ₹${total.toFixed(2)}</p>
          </div>
          <p>You can track the status of your order on our website or by logging into your account.</p>
          <br />
          <p>Best regards,<br/>The StarBy Team</p>
        </div>
      `,
    });

    console.log('Order confirmation email sent successfully:', data);
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

  try {
    const data = await resend.emails.send({
      from: 'StarBy Contact <contact@starby.in>',
      to: ['admin@starby.in'],
      replyTo: email,
      subject: `New Contact: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    });

    console.log('Contact email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return false;
  }
}
