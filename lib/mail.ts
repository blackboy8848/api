/**
 * Mail service utilities: send (SMTP via Nodemailer) and inbox (IMAP via ImapFlow).
 * All credentials come from environment variables only; never exposed to frontend.
 */

import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

// --- SMTP (send) configuration ---
// Port 465 = SSL; credentials from env only
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const useSecure = SMTP_PORT === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: useSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

/** Result of sending an email */
export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via SMTP (Nodemailer).
 * Uses SMTP_* env vars only.
 */
export async function sendMail(
  to: string,
  subject: string,
  message: string
): Promise<SendMailResult> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return {
      success: false,
      error: 'Mail server is not configured (missing SMTP env vars).',
    };
  }
  if (!to?.trim()) {
    return { success: false, error: 'Recipient (to) is required.' };
  }

  try {
    const info = await transporter.sendMail({
      from: from || undefined,
      to: to.trim(),
      subject: subject || '(No subject)',
      text: message || '',
      html: message
        ? message.replace(/\n/g, '<br>')
        : '<p>(No content)</p>',
    });

    if (info.rejected && info.rejected.length > 0) {
      return {
        success: false,
        error: `Rejected: ${info.rejected.join(', ')}`,
      };
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    return {
      success: false,
      error: message,
    };
  }
}

// --- IMAP (inbox) types and config ---
export interface InboxEmail {
  subject: string;
  from: string;
  date: string;
  uid?: number;
}

/**
 * Read inbox via IMAP (ImapFlow).
 * Uses IMAP_* env vars only. Returns list of emails with subject, from, date.
 */
export async function getInbox(limit: number = 50): Promise<InboxEmail[]> {
  const host = process.env.IMAP_HOST;
  const user = process.env.IMAP_USER;
  const password = process.env.IMAP_PASSWORD;
  const port = parseInt(process.env.IMAP_PORT || '993', 10);

  if (!host || !user || !password) {
    throw new Error('Mail server is not configured (missing IMAP env vars).');
  }

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: {
      user,
      pass: password,
    },
    logger: false,
  });

  const emails: InboxEmail[] = [];

  try {
    await client.connect();

    const mailbox = await client.mailboxOpen('INBOX');
    const start = Math.max(1, mailbox.exists - limit + 1);
    const end = mailbox.exists;

    if (end < 1) {
      return [];
    }

    for await (const msg of client.fetch(
      { start, end },
      { envelope: true }
    )) {
      const env = msg.envelope;
      emails.push({
        subject: env?.subject || '(No subject)',
        from: env?.from?.[0]?.address || env?.from?.[0]?.name || 'Unknown',
        date: env?.date ? new Date(env.date).toISOString() : '',
        uid: msg.uid,
      });
    }

    // API contract: list with subject, from, date (newest first)
    return emails.reverse();
  } finally {
    await client.logout();
  }
}
