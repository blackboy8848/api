import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { sendContactFormToAdmin } from '@/lib/email';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contact – Contact form submission.
 * 1. Sends email to admin inbox using SMTP (.env: SMTP_HOST, SMTP_USER, SMTP_FROM, etc.)
 * 2. Inserts into admin_emails so it appears in Dashboard → Email (inbox).
 * Body: from_email, from_name?, subject, body, body_html?, source?
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => ({}));
    const {
      from_email,
      from_name,
      subject,
      body: messageBody,
      body_html,
      source = 'contact_form',
    } = body;

    if (!from_email || typeof from_email !== 'string' || !from_email.trim()) {
      const res = NextResponse.json({ error: 'from_email is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      const res = NextResponse.json({ error: 'subject is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }
    if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
      const res = NextResponse.json({ error: 'body is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const toEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
    await sendContactFormToAdmin(
      from_email.trim(),
      from_name && typeof from_name === 'string' ? from_name.trim() : null,
      subject.trim(),
      messageBody.trim(),
      body_html && typeof body_html === 'string' ? body_html : null
    );

    const id = randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const metadata = body.metadata && typeof body.metadata === 'object' ? JSON.stringify(body.metadata) : null;

    const db = await pool.getConnection();
    await db.execute(
      `INSERT INTO admin_emails (
        id, from_email, from_name, to_email, subject, body, body_html,
        received_at, source, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        from_email.trim(),
        from_name?.trim() || null,
        toEmail,
        subject.trim(),
        messageBody.trim(),
        body_html?.trim() || null,
        now,
        typeof source === 'string' ? source : 'contact_form',
        metadata,
        now,
        now,
      ]
    );
    db.release();

    const res = NextResponse.json(
      { message: 'Message sent successfully', id },
      { status: 201 }
    );
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json(
      { error: err?.message || 'Failed to send message' },
      { status: 500 }
    );
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
