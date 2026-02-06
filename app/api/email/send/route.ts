/**
 * Compatibility route.
 *
 * Some clients call `/api/email/send` while our canonical route is `/api/mail/send`.
 * This file keeps backward compatibility by serving the same SMTP send behavior.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { to, subject, message } = body as { to?: string; subject?: string; message?: string };

    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "to" (recipient email)' },
        { status: 400 }
      );
    }

    const result = await sendMail(
      to,
      typeof subject === 'string' ? subject : '',
      typeof message === 'string' ? message : ''
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

