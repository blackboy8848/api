import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AdminEmail } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// GET /api/admin/emails – list inbox with pagination and optional unread filter
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const unreadOnly = searchParams.get('unread_only') === 'true';

    const db = await pool.getConnection();

    let where = '1=1';
    const params: (string | number)[] = [];
    if (unreadOnly) {
      where += ' AND read_at IS NULL';
    }

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM admin_emails WHERE ${where}`,
      params
    );
    const total = (countRows as { total: number }[])[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT * FROM admin_emails WHERE ${where} ORDER BY received_at DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const emails = rows as AdminEmail[];
    db.release();

    const res = NextResponse.json({ emails, total });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
