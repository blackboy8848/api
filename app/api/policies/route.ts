import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Policy, PolicyType } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

const VALID_POLICY_TYPES: PolicyType[] = [
  'inclusions',
  'exclusions',
  'cancellation_policies',
  'terms_and_conditions',
  'faqs',
  'what_to_carry',
  'additional_info',
];

// OPTIONS - Handle preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET - List policies with optional filter by policy_type and sort
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const policy_type = searchParams.get('policy_type');
    const sort = searchParams.get('sort') || 'newest';

    const db = await pool.getConnection();

    let query = 'SELECT * FROM global_policies WHERE 1=1';
    const params: (string | number)[] = [];

    if (policy_type && VALID_POLICY_TYPES.includes(policy_type as PolicyType)) {
      query += ' AND policy_type = ?';
      params.push(policy_type);
    }

    query += sort === 'oldest'
      ? ' ORDER BY policy_type, sort_order ASC, created_at ASC'
      : ' ORDER BY policy_type, sort_order ASC, created_at DESC';

    const [rows] = await db.execute(query, params);
    const policies = rows as Policy[];
    db.release();

    const res = NextResponse.json(policies);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// POST - Create policy item
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const {
      policy_type,
      title,
      content,
      sort_order = 0,
    } = body;

    if (!policy_type || !title || typeof title !== 'string' || !title.trim()) {
      const res = NextResponse.json(
        { error: 'policy_type and title are required' },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    if (!VALID_POLICY_TYPES.includes(policy_type as PolicyType)) {
      const res = NextResponse.json(
        { error: `policy_type must be one of: ${VALID_POLICY_TYPES.join(', ')}` },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();

    const [result] = await db.execute(
      `INSERT INTO global_policies (policy_type, title, content, sort_order)
       VALUES (?, ?, ?, ?)`,
      [
        policy_type,
        String(title).trim(),
        content != null && String(content).trim() ? String(content).trim() : null,
        Number(sort_order) || 0,
      ]
    );

    const insertResult = result as { insertId?: number };
    const id = insertResult?.insertId;
    db.release();

    if (!id) {
      const res = NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json(
      { message: 'Policy created successfully', id },
      { status: 201 }
    );
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
