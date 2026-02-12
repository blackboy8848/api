import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const THANK_YOU_SUBJECT = 'Thank you for subscribing!';
const THANK_YOU_MESSAGE = `Thank you for subscribing to our newsletter!

You'll be the first to know about new tours, exclusive offers, and upcoming adventures.

We're excited to have you on board.

— Mountain Mirage Backpackers`;

// OPTIONS - Handle preflight for Subscribe form (cross-origin)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// POST - Subscribe email to newsletter; save to DB and send thank-you email
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email) {
      const res = NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    if (!EMAIL_REGEX.test(email)) {
      const res = NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    let isNewSubscriber = true;

    try {
      const [result] = await db.execute(
        `INSERT INTO newsletter_subscribers (email, subscribed) VALUES (?, 1)`,
        [email]
      );
      const insertResult = result as { insertId?: number; affectedRows?: number };
      if (insertResult?.affectedRows === 0) {
        isNewSubscriber = false;
      }
    } catch (insertErr: unknown) {
      const err = insertErr as { code?: string };
      if (err?.code === 'ER_DUP_ENTRY') {
        isNewSubscriber = false;
      } else {
        db.release();
        throw insertErr;
      }
    }
    db.release(); // release after successful insert or after handling duplicate

    // Send thank-you email for new subscribers (and optionally for existing to be friendly)
    const mailResult = await sendMail(email, THANK_YOU_SUBJECT, THANK_YOU_MESSAGE);

    if (!mailResult.success && isNewSubscriber) {
      // Subscriber was saved; email failed. Still return 201 but mention email may be delayed.
      const res = NextResponse.json(
        {
          message: 'You are subscribed. Confirmation email could not be sent; you will still receive our updates.',
          subscribed: true,
        },
        { status: 201 }
      );
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json(
      {
        message: isNewSubscriber
          ? 'Thank you for subscribing! Check your inbox for a confirmation.'
          : 'You were already subscribed. We sent you a quick thank-you note.',
        subscribed: true,
      },
      { status: 201 }
    );
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
