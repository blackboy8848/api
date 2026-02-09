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

/** Tour shape for email content (includes optional banner image) */
export interface TourForEmail {
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
  bannerImageUrl?: string;
}

function buildTourDetailsHtml(tours: TourForEmail[]): string {
  return tours
    .map(
      (t) => `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #eee;">
          ${t.bannerImageUrl ? `<img src="${escapeAttr(t.bannerImageUrl)}" alt="" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin-bottom: 12px;" />` : ''}
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
}

/**
 * Send tour details email to a user (tours listed in HTML, optional banner image per tour)
 * @param to - Recipient email address
 * @param displayName - User's display name (optional)
 * @param tours - Array of tour objects (title, description, duration, price, location, bannerImageUrl, etc.)
 * @returns Promise<boolean> - true if email sent successfully
 */
export async function sendTourDetailsEmail(
  to: string,
  displayName: string | null,
  tours: TourForEmail[]
): Promise<boolean> {
  const name = displayName || 'Traveler';
  const tourRows = buildTourDetailsHtml(tours);
  const subject = buildToursSubject(tours);

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
      subject,
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

/** Escape for HTML attribute values (e.g. src) so quotes don't break the attribute */
function escapeAttr(s: string): string {
  return (s || '')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildToursSubject(tours: TourForEmail[]): string {
  const brand = 'Mountain Mirage Backpackers';
  const count = tours.length;

  const firstTitle = (tours[0]?.title || 'Tour').trim();
  const title = truncateForSubject(firstTitle, 60);

  if (count <= 1) return `Tour Details: ${title} – ${brand}`;

  const more = ` +${count - 1} more`;
  return `Our Tours: ${title}${more} – ${brand}`;
}

function truncateForSubject(s: string, maxLen: number): string {
  if (!s) return s;
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

/** Booking confirmation payload for email */
export interface BookingConfirmationPayload {
  bookingId: string;
  guestCount: number;
  dateTime: string; // e.g. "Tomorrow at 2:30 PM" or "15 Jan 2025 at 2:30 PM"
  tourName?: string;
  totalAmount?: number;
}

/**
 * Send booking confirmation email after successful reservation.
 * Matches the confirmation screen: "Your booking is confirmed!", summary, and "See all details" link.
 */
export async function sendBookingConfirmationEmail(
  to: string,
  payload: BookingConfirmationPayload
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || '';
  const detailsPath = `/booking-details/${payload.bookingId}`;
  const detailsUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${detailsPath}` : detailsPath;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #fff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #22c55e; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="color: #fff; font-size: 32px; line-height: 1;">✓</span>
        </div>
        <h1 style="margin: 0 0 8px; font-size: 24px; color: #1a1a1a;">Your booking is confirmed!</h1>
        <p style="margin: 0; color: #666; font-size: 15px;">Hi! We have successfully received your reservation.</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <div style="display: flex; justify-content: space-between; color: #555; font-size: 14px; margin-bottom: 24px;">
        <span><strong>${payload.guestCount}</strong> guest${payload.guestCount !== 1 ? 's' : ''}</span>
        <span>${escapeHtml(payload.dateTime)}</span>
      </div>
      ${payload.tourName ? `<p style="color: #555; font-size: 14px; margin-bottom: 16px;">Tour: ${escapeHtml(payload.tourName)}</p>` : ''}
      ${payload.totalAmount != null ? `<p style="color: #555; font-size: 14px; margin-bottom: 16px;">Total: ₹${payload.totalAmount.toLocaleString()}</p>` : ''}
      <a href="${escapeAttr(detailsUrl)}" style="display: block; text-align: center; background: #2563eb; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">See all details</a>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">— Mountain Mirage Backpackers</p>
    </div>
  `;

  const text = `Your booking is confirmed!\n\nHi! We have successfully received your reservation.\n${payload.guestCount} guest(s) · ${payload.dateTime}${payload.tourName ? `\nTour: ${payload.tourName}` : ''}${payload.totalAmount != null ? `\nTotal: ₹${payload.totalAmount.toLocaleString()}` : ''}\n\nSee all details: ${detailsUrl}`;

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'Booking confirmed – Mountain Mirage Backpackers',
      html,
      text,
    };
    const info = await transporter.sendMail(mailOptions);
    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`Email rejected: ${info.rejected.join(', ')}`);
    }
    return true;
  } catch (err: unknown) {
    console.error('Error sending booking confirmation email to', to, err);
    throw err;
  }
}

/** Lead details for assignment email (subset of Lead) */
export interface LeadDetailsForEmail {
  id?: number;
  name: string;
  email: string;
  phone_country_code?: string | null;
  phone_number: string;
  lead_source?: string | null;
  lead_state?: string | null;
  lead_status?: string | null;
  enquiry_destination?: string | null;
  tour_id?: string | null;
  event_id?: string | null;
  slot_id?: number | null;
  notes?: string | null;
  remarks?: string | null;
  created_at?: Date | string | null;
}

/**
 * Send lead assignment email to the assigned super user with full lead details.
 * Called when a lead is assigned (Assigned To is set) so the assignee gets the details by email.
 */
export async function sendLeadAssignmentEmail(
  to: string,
  assigneeDisplayName: string | null,
  lead: LeadDetailsForEmail
): Promise<boolean> {
  const name = assigneeDisplayName || 'Team Member';
  const phone = [lead.phone_country_code, lead.phone_number].filter(Boolean).join(' ').trim() || lead.phone_number || '—';
  const created = lead.created_at
    ? (typeof lead.created_at === 'string' ? new Date(lead.created_at) : lead.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #fff;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: #1a1a1a;">Lead assigned to you</h2>
      <p style="margin: 0 0 24px; color: #555; font-size: 15px;">Hi ${escapeHtml(name)}, a lead has been assigned to you. Details below.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Lead ID</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(String(lead.id ?? '—'))}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(lead.name)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(lead.email)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Phone</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(phone)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">State</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(lead.lead_state ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Status</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(lead.lead_status ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Source</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(lead.lead_source ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Enquiry</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(lead.enquiry_destination ?? '—')}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Tour / Event</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml([lead.tour_id, lead.event_id].filter(Boolean).join(' · ') || '—')}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Created</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(created)}</td></tr>
        ${lead.notes ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Notes</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(lead.notes)}</td></tr>` : ''}
        ${lead.remarks ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Remarks</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(lead.remarks)}</td></tr>` : ''}
      </table>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">— Mountain Mirage Backpackers</p>
    </div>
  `;

  const text = `Lead assigned to you\n\nHi ${name}, a lead has been assigned to you.\n\nLead ID: ${lead.id ?? '—'}\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${phone}\nState: ${lead.lead_state ?? '—'}\nStatus: ${lead.lead_status ?? '—'}\nSource: ${lead.lead_source ?? '—'}\nEnquiry: ${lead.enquiry_destination ?? '—'}\nTour/Event: ${[lead.tour_id, lead.event_id].filter(Boolean).join(' · ') || '—'}\nCreated: ${created}${lead.notes ? `\nNotes: ${lead.notes}` : ''}${lead.remarks ? `\nRemarks: ${lead.remarks}` : ''}`;

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Lead assigned: ${lead.name} – Mountain Mirage Backpackers`,
      html,
      text,
    };
    const info = await transporter.sendMail(mailOptions);
    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`Email rejected: ${info.rejected.join(', ')}`);
    }
    return true;
  } catch (err: unknown) {
    console.error('Error sending lead assignment email to', to, err);
    throw err;
  }
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
