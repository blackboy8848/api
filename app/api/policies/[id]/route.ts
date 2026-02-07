import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Policy, PolicyType } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

const VALID_POLICY_TYPES: PolicyType[] = [
  'inclusions',
  'exclusions',
  'cancellation_policies',
  'terms_and_conditions',
  'faqs',
  'what_to_carry',
  'additional_info',
];

// GET - Single policy by id
export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Policy id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [rows] = await db.execute('SELECT * FROM global_policies WHERE id = ?', [id]);
    db.release();

    const policies = rows as Policy[];
    if (!Array.isArray(policies) || policies.length === 0) {
      const res = NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json(policies[0]);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// PUT - Update policy
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Policy id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const body = await request.json();
    const { policy_type, title, content, sort_order } = body;

    const updates: { field: string; value: unknown }[] = [];
    if (policy_type !== undefined) {
      if (!VALID_POLICY_TYPES.includes(policy_type as PolicyType)) {
        const res = NextResponse.json(
          { error: `policy_type must be one of: ${VALID_POLICY_TYPES.join(', ')}` },
          { status: 400 }
        );
        return addCorsHeaders(res, origin);
      }
      updates.push({ field: 'policy_type', value: policy_type });
    }
    if (title !== undefined) updates.push({ field: 'title', value: String(title).trim() });
    if (content !== undefined) updates.push({
      field: 'content',
      value: content == null || content === '' ? null : String(content).trim(),
    });
    if (sort_order !== undefined) updates.push({ field: 'sort_order', value: Number(sort_order) ?? 0 });

    if (updates.length === 0) {
      const res = NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const setClause = updates.map((u) => `${u.field} = ?`).join(', ');
    const values = updates.map((u) => u.value);
    const [result] = await db.execute(
      `UPDATE global_policies SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    db.release();

    const updateResult = result as { affectedRows?: number };
    if (updateResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Policy updated successfully', id });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// DELETE - Delete policy
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Policy id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM global_policies WHERE id = ?', [id]);
    db.release();

    const deleteResult = result as { affectedRows?: number };
    if (deleteResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Policy deleted successfully' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
