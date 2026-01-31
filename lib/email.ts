import nodemailer from 'nodemailer';

// Determine if we should use secure (SSL) or STARTTLS
const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const useSecure = smtpPort === 465; // Port 465 uses SSL, 587 uses STARTTLS

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: smtpPort,
  secure: useSecure, // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER, // Your email address
    pass: process.env.SMTP_PASSWORD, // Your email password
  },
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false,
  },
  debug: true, // Enable debug output
  logger: true, // Log to console
});

/**
 * Send OTP email to user
 * @param to - Recipient email address
 * @param otp - The OTP code to send
 * @returns Promise<boolean> - true if email sent successfully
 */
export async function sendOTPEmail(to: string, otp: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER, // Sender address
      to: to, // Recipient address
      subject: 'Your OTP Code', // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">One-Time Password (OTP)</h2>
          <p style="color: #666; font-size: 16px;">Your OTP code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
    };

    console.log(`Attempting to send OTP email to: ${to}`);
    console.log(`From: ${process.env.SMTP_FROM || process.env.SMTP_USER}`);
    console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`SMTP Port: ${process.env.SMTP_PORT}`);

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Accepted recipients:', info.accepted);
    console.log('Rejected recipients:', info.rejected);
    
    if (info.rejected && info.rejected.length > 0) {
      console.error('Email was rejected for:', info.rejected);
      throw new Error(`Email rejected: ${info.rejected.join(', ')}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error sending OTP email:');
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Send tour details email to a user (all tours listed in HTML)
 * @param to - Recipient email address
 * @param displayName - User's display name (optional)
 * @param tours - Array of tour objects (title, description, duration, price, location, etc.)
 * @returns Promise<boolean> - true if email sent successfully
 */
export async function sendTourDetailsEmail(
  to: string,
  displayName: string | null,
  tours: Array<{
    title?: string;
    subdescription?: string;
    description?: string;
    duration?: string;
    price?: number;
    location?: string;
    difficulty?: string;
    maxGroupSize?: number;
    imageUrl?: string;
    category?: string;
    subCategory?: string;
  }>
): Promise<boolean> {
  const name = displayName || 'Traveler';
  const tourRows = tours
    .map(
      (t) => `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">${escapeHtml(t.title || 'Untitled Tour')}</h3>
          ${t.subdescription ? `<p style="margin: 0 0 8px 0; color: #555; font-size: 14px;">${escapeHtml(t.subdescription)}</p>` : ''}
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${escapeHtml((t.description || '').slice(0, 200))}${(t.description || '').length > 200 ? '...' : ''}</p>
          <p style="margin: 0; font-size: 13px; color: #333;">
            <strong>Duration:</strong> ${escapeHtml(t.duration || '—')} &nbsp;|&nbsp;
            <strong>Price:</strong> ₹${typeof t.price === 'number' ? t.price.toLocaleString() : (t.price ?? '—')} &nbsp;|&nbsp;
            <strong>Location:</strong> ${escapeHtml(t.location || '—')}
            ${t.difficulty ? ` &nbsp;|&nbsp; <strong>Difficulty:</strong> ${escapeHtml(t.difficulty)}` : ''}
          </p>
        </td>
      </tr>
    `
    )
    .join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Hello ${escapeHtml(name)}!</h2>
      <p style="color: #555; font-size: 16px;">Here are our current tours for you to explore:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        ${tourRows}
      </table>
      <p style="color: #888; font-size: 14px; margin-top: 24px;">We hope to see you on the trails soon.</p>
      <p style="color: #888; font-size: 12px;">— Mountain Mirage Backpackers</p>
    </div>
  `;

  const text = tours
    .map(
      (t) =>
        `${t.title || 'Untitled Tour'}\n${t.subdescription || ''}\n${(t.description || '').slice(0, 150)}...\nDuration: ${t.duration || '—'} | Price: ₹${t.price ?? '—'} | Location: ${t.location || '—'}\n`
    )
    .join('\n---\n');

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'Our Tours – Mountain Mirage Backpackers',
      html: emailHtml,
      text: `Hello ${name}! Here are our current tours:\n\n${text}`,
    };
    const info = await transporter.sendMail(mailOptions);
    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`Email rejected: ${info.rejected.join(', ')}`);
    }
    return true;
  } catch (error: unknown) {
    console.error('Error sending tour details email to', to, error);
    throw error;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Verify SMTP connection
 * @returns Promise<boolean> - true if connection is successful
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP server is ready to send emails');
    return true;
  } catch (error) {
    console.error('SMTP connection error:', error);
    return false;
  }
}
