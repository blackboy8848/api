import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AdminEmail } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

// GET /api/admin/emails/:id – single email
export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Email id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [rows] = await db.execute('SELECT * FROM admin_emails WHERE id = ?', [id]);
    db.release();

    const emails = rows as AdminEmail[];
    if (Array.isArray(emails) && emails.length === 0) {
      const res = NextResponse.json({ error: 'Email not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json(emails[0]);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// PUT /api/admin/emails/:id – mark as read (body: { read: true })
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Email id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const body = await request.json().catch(() => ({}));
    if (body.read !== true) {
      const res = NextResponse.json({ error: 'Request body must include { "read": true }' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute(
      'UPDATE admin_emails SET read_at = COALESCE(read_at, NOW()) WHERE id = ?',
      [id]
    );
    db.release();

    const updateResult = result as { affectedRows?: number };
    if (updateResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Email not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Email marked as read' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
