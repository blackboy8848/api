/**
 * Mail service utilities: send (SMTP via Nodemailer) and inbox (IMAP via node-imap).
 * All credentials come from environment variables only; never exposed to frontend.
 */

import nodemailer from 'nodemailer';
import Imap from 'imap';

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

export interface EmailDetails {
  uid: number;
  subject: string;
  from: string;
  date: string;
  /**
   * Raw message text (best-effort). For complex multipart emails this may include MIME.
   * Keep this endpoint lightweight; if you need full parsing, add a dedicated parser later.
   */
  text: string;
}

/**
 * Read inbox via IMAP (node-imap).
 * Uses IMAP_* env vars only. Returns list of emails with subject, from, date.
 *
 * Notes:
 * - We only fetch email headers (no bodies) for performance.
 * - This avoids Turbopack build issues caused by transitive logger deps in some IMAP libs.
 */
export async function getInbox(limit: number = 50): Promise<InboxEmail[]> {
  const host = process.env.IMAP_HOST;
  const user = process.env.IMAP_USER;
  const password = process.env.IMAP_PASSWORD;
  const port = parseInt(process.env.IMAP_PORT || '993', 10);

  if (!host || !user || !password) {
    throw new Error('Mail server is not configured (missing IMAP env vars).');
  }

  // Wrap callback/event based node-imap API into a Promise.
  return await new Promise<InboxEmail[]>((resolve, reject) => {
    const imap = new Imap({
      user,
      password,
      host,
      port,
      tls: true,
      tlsOptions: { rejectUnauthorized: true },
    });

    const safeEnd = (err: unknown) => {
      try {
        imap.end();
      } catch {
        // ignore
      }
      if (err) reject(err);
    };

    const emails: InboxEmail[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (openErr) => {
        if (openErr) return safeEnd(openErr);

        // Get latest N messages (by sequence number).
        imap.search(['ALL'], (searchErr, results) => {
          if (searchErr) return safeEnd(searchErr);

          const total = results?.length || 0;
          if (total === 0) {
            imap.end();
            return resolve([]);
          }

          const last = results.slice(Math.max(0, total - limit));
          const fetcher = imap.fetch(last, {
            bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)',
            struct: false,
          });

          fetcher.on('message', (msg) => {
            let uid: number | undefined;
            let from = 'Unknown';
            let subject = '(No subject)';
            let date = '';

            msg.on('attributes', (attrs) => {
              uid = typeof attrs?.uid === 'number' ? attrs.uid : undefined;
            });

            msg.on('body', (stream) => {
              let raw = '';
              stream.on('data', (chunk) => {
                raw += chunk.toString('utf8');
              });
              stream.once('end', () => {
                // Very small header parser (enough for our needs).
                const lines = raw.split(/\r?\n/);
                const headerMap: Record<string, string> = {};
                for (const line of lines) {
                  const idx = line.indexOf(':');
                  if (idx === -1) continue;
                  const k = line.slice(0, idx).trim().toLowerCase();
                  const v = line.slice(idx + 1).trim();
                  if (k && v) headerMap[k] = v;
                }

                from = headerMap['from'] || from;
                subject = headerMap['subject'] || subject;
                const dateRaw = headerMap['date'];
                if (dateRaw) {
                  const d = new Date(dateRaw);
                  date = Number.isNaN(d.getTime()) ? '' : d.toISOString();
                }
              });
            });

            msg.once('end', () => {
              emails.push({ from, subject, date, uid });
            });
          });

          fetcher.once('error', (fetchErr) => safeEnd(fetchErr));
          fetcher.once('end', () => {
            // Newest first
            emails.sort((a, b) => (b.uid || 0) - (a.uid || 0));
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', (err) => safeEnd(err));
    imap.once('end', () => {
      // connection ended
    });

    imap.connect();
  });
}

/**
 * Fetch a single email by UID from the INBOX.
 * Uses IMAP_* env vars only.
 */
export async function getEmailByUid(uid: number): Promise<EmailDetails> {
  const host = process.env.IMAP_HOST;
  const user = process.env.IMAP_USER;
  const password = process.env.IMAP_PASSWORD;
  const port = parseInt(process.env.IMAP_PORT || '993', 10);

  if (!host || !user || !password) {
    throw new Error('Mail server is not configured (missing IMAP env vars).');
  }
  if (!Number.isFinite(uid) || uid <= 0) {
    throw new Error('Invalid email id (uid).');
  }

  return await new Promise<EmailDetails>((resolve, reject) => {
    const imap = new Imap({
      user,
      password,
      host,
      port,
      tls: true,
      tlsOptions: { rejectUnauthorized: true },
    });

    const safeEnd = (err: unknown) => {
      try {
        imap.end();
      } catch {
        // ignore
      }
      if (err) reject(err);
    };

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (openErr) => {
        if (openErr) return safeEnd(openErr);

        let from = 'Unknown';
        let subject = '(No subject)';
        let date = '';
        let text = '';

        // IMPORTANT: `imap.fetch()` fetches by UID; `imap.seq.fetch()` fetches by sequence number.
        const fetcher = imap.fetch(uid, {
          bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)', 'TEXT'],
          struct: false,
        });

        let found = false;

        fetcher.on('message', (msg) => {
          found = true;

          msg.on('body', (stream, info) => {
            let raw = '';
            stream.on('data', (chunk) => {
              raw += chunk.toString('utf8');
            });

            stream.once('end', () => {
              const which = (info?.which || '').toString().toUpperCase();
              if (which.includes('HEADER')) {
                const lines = raw.split(/\r?\n/);
                const headerMap: Record<string, string> = {};
                for (const line of lines) {
                  const idx = line.indexOf(':');
                  if (idx === -1) continue;
                  const k = line.slice(0, idx).trim().toLowerCase();
                  const v = line.slice(idx + 1).trim();
                  if (k && v) headerMap[k] = v;
                }

                from = headerMap['from'] || from;
                subject = headerMap['subject'] || subject;
                const dateRaw = headerMap['date'];
                if (dateRaw) {
                  const d = new Date(dateRaw);
                  date = Number.isNaN(d.getTime()) ? '' : d.toISOString();
                }
              } else {
                // Best-effort text extraction (may include MIME for multipart emails).
                text += raw;
              }
            });
          });
        });

        fetcher.once('error', (fetchErr) => safeEnd(fetchErr));
        fetcher.once('end', () => {
          if (!found) {
            return safeEnd(new Error('Email not found'));
          }
          // Keep response size bounded.
          const maxLen = 100_000;
          const trimmed = text.length > maxLen ? text.slice(0, maxLen) : text;
          imap.end();
          resolve({
            uid,
            from,
            subject,
            date,
            text: trimmed,
          });
        });
      });
    });

    imap.once('error', (err) => safeEnd(err));
    imap.connect();
  });
}
