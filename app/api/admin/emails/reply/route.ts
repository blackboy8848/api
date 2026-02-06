import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { sendReplyEmail } from '@/lib/email';
import { AdminEmail } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// POST /api/admin/emails/reply – send reply and update original email
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => ({}));
    const { email_id, body: replyBody, body_html: replyBodyHtml } = body;

    if (!email_id) {
      const res = NextResponse.json({ error: 'email_id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }
    if (!replyBody || typeof replyBody !== 'string' || !replyBody.trim()) {
      const res = NextResponse.json({ error: 'body is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();

    const [rows] = await db.execute('SELECT * FROM admin_emails WHERE id = ?', [email_id]);
    const emails = rows as AdminEmail[];
    if (Array.isArray(emails) && emails.length === 0) {
      db.release();
      const res = NextResponse.json({ error: 'Email not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const original = emails[0];
    const to = original.from_email;
    const subject = original.subject.startsWith('Re:') ? original.subject : `Re: ${original.subject}`;

    const { messageId } = await sendReplyEmail(
      to,
      subject,
      replyBody.trim(),
      replyBodyHtml && typeof replyBodyHtml === 'string' ? replyBodyHtml : null
    );

    const replyId = randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.execute(
      `INSERT INTO admin_email_replies (id, email_id, body, body_html, sent_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [replyId, email_id, replyBody.trim(), replyBodyHtml || null, now, now]
    );
    await db.execute(
      'UPDATE admin_emails SET replied_at = ?, reply_message_id = ?, updated_at = ? WHERE id = ?',
      [now, replyId, now, email_id]
    );
    db.release();

    const res = NextResponse.json({
      success: true,
      message: 'Reply sent',
      id: replyId,
    });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json(
      { error: err?.message || 'Failed to send reply' },
      { status: 500 }
    );
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
