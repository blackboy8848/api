import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Coupon } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// OPTIONS - Handle preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET - List coupons with optional filters (search, coupon_level, coupon_type, sort)
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const coupon_level = searchParams.get('coupon_level');
    const coupon_type = searchParams.get('coupon_type');
    const sort = searchParams.get('sort') || 'newest';

    const db = await pool.getConnection();

    let query = 'SELECT * FROM coupons WHERE 1=1';
    const params: (string | number)[] = [];

    if (search && search.trim()) {
      query += ' AND coupon_code LIKE ?';
      params.push(`%${search.trim()}%`);
    }
    if (coupon_level) {
      query += ' AND coupon_level = ?';
      params.push(coupon_level);
    }
    if (coupon_type) {
      query += ' AND coupon_type = ?';
      params.push(coupon_type);
    }

    query += sort === 'oldest' ? ' ORDER BY created_at ASC' : ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    const coupons = rows as Coupon[];
    db.release();

    const res = NextResponse.json(coupons);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// POST - Create coupon (and optionally coupon_events, coupon_slots)
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const {
      coupon_level = 'event',
      coupon_code,
      discount_type = 'percentage',
      discount_applicable = 'per_person',
      discount,
      coupon_inventory = 0,
      group_size,
      affiliate_email,
      coupon_type = 'private',
      valid_from,
      valid_till,
      validity_type = 'fixed_date',
      company_id,
      event_ids,
      slot_ids,
    } = body;

    if (!coupon_code || discount == null || discount === '') {
      const res = NextResponse.json(
        { error: 'coupon_code and discount are required' },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();

    const [result] = await db.execute(
      `INSERT INTO coupons (
        coupon_level, coupon_code, discount_type, discount_applicable, discount,
        coupon_inventory, group_size, affiliate_email, coupon_type,
        valid_from, valid_till, validity_type, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        coupon_level,
        String(coupon_code).trim(),
        discount_type,
        discount_applicable,
        Number(discount),
        Number(coupon_inventory) || 0,
        group_size != null && group_size !== '' ? Number(group_size) : null,
        affiliate_email && String(affiliate_email).trim() ? String(affiliate_email).trim() : null,
        coupon_type,
        valid_from && String(valid_from).trim() ? String(valid_from).trim() : null,
        valid_till && String(valid_till).trim() ? String(valid_till).trim() : null,
        validity_type,
        company_id && String(company_id).trim() ? String(company_id).trim() : null,
      ]
    );

    const insertResult = result as { insertId?: number };
    const id = insertResult?.insertId;
    if (!id) {
      db.release();
      const res = NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
      return addCorsHeaders(res, origin);
    }

    const evIds = Array.isArray(event_ids) ? event_ids : [];
    const slIds = Array.isArray(slot_ids) ? slot_ids : [];

    if (evIds.length > 0 && (coupon_level === 'event' || coupon_level === 'batch')) {
      for (const eid of evIds) {
        if (eid) await db.execute('INSERT IGNORE INTO coupon_events (coupon_id, event_id) VALUES (?, ?)', [id, String(eid)]);
      }
    }
    if (slIds.length > 0 && coupon_level === 'batch') {
      for (const sid of slIds) {
        if (sid != null) await db.execute('INSERT IGNORE INTO coupon_slots (coupon_id, slot_id) VALUES (?, ?)', [id, Number(sid)]);
      }
    }

    db.release();

    const res = NextResponse.json(
      { message: 'Coupon created successfully', id, event_ids: evIds, slot_ids: slIds },
      { status: 201 }
    );
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    const status = err?.code === 'ER_DUP_ENTRY' ? 409 : 500;
    const res = NextResponse.json(
      { error: err?.code === 'ER_DUP_ENTRY' ? 'Coupon code already exists' : err?.message || 'Server error' },
      { status }
    );
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
