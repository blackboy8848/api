import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { addCorsHeaders } from '@/lib/cors';
import { sendTourDetailsEmail } from '@/lib/email';

function parseTourJsonFields(tour: Record<string, unknown>): Record<string, unknown> {
  const parsed = { ...tour };
  const jsonFields = ['images', 'startDates', 'included', 'notIncluded', 'schedule'];
  jsonFields.forEach((field) => {
    const val = parsed[field];
    if (val && typeof val === 'string') {
      try {
        parsed[field] = JSON.parse(val as string);
      } catch {
        parsed[field] = null;
      }
    }
  });
  return parsed;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

/**
 * POST /api/email/tour-details
 * Sends all tour details to all users via email.
 * Optional query: ?activeOnly=true to send only active tours.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      const response = NextResponse.json(
        {
          error:
            'Email service not configured. Set SMTP_USER and SMTP_PASSWORD in environment.',
        },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const db = await pool.getConnection();

    const [userRows] = await db.execute(
      'SELECT email, display_name FROM users WHERE email IS NOT NULL AND email != ""'
    );
    const users = userRows as Array<{ email: string; display_name?: string | null }>;

    let tourQuery = 'SELECT * FROM tours';
    const tourParams: unknown[] = [];
    if (activeOnly) {
      tourQuery += ' WHERE isActive = ?';
      tourParams.push(1);
    }
    tourQuery += ' ORDER BY created_at DESC';

    const [tourRows] = await db.execute(tourQuery, tourParams);
    db.release();

    const rawTours = tourRows as Record<string, unknown>[];
    const tours = rawTours.map((t) => parseTourJsonFields(t));

    if (users.length === 0) {
      const response = NextResponse.json(
        { success: true, message: 'No users with email found', sent: 0, failed: 0 },
        { status: 200 }
      );
      return addCorsHeaders(response, origin);
    }

    if (tours.length === 0) {
      const response = NextResponse.json(
        { success: false, error: 'No tours found to send', sent: 0, failed: 0 },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    let sent = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const user of users) {
      const email = user.email?.trim();
      if (!email) continue;
      try {
        await sendTourDetailsEmail(
          email,
          user.display_name ?? null,
          tours as Parameters<typeof sendTourDetailsEmail>[2]
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ email, error: message });
      }
    }

    const response = NextResponse.json(
      {
        success: failed === 0,
        message: `Tour details sent to ${sent} user(s)${failed > 0 ? `; ${failed} failed` : ''}.`,
        sent,
        failed,
        totalUsers: users.length,
        tourCount: tours.length,
        ...(errors.length > 0 && { errors }),
      },
      { status: 200 }
    );
    return addCorsHeaders(response, origin);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const response = NextResponse.json({ error: message }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}
