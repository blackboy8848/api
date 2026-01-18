import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Coupon } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

// GET - Single coupon by id with event_ids and slot_ids
export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Coupon id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();

    const [rows] = await db.execute('SELECT * FROM coupons WHERE id = ?', [id]);
    const coupons = rows as Coupon[];
    if (Array.isArray(coupons) && coupons.length === 0) {
      db.release();
      const res = NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const [evRows] = await db.execute('SELECT event_id FROM coupon_events WHERE coupon_id = ?', [id]);
    const [slRows] = await db.execute('SELECT slot_id FROM coupon_slots WHERE coupon_id = ?', [id]);
    db.release();

    const event_ids = (Array.isArray(evRows) ? (evRows as { event_id: string }[]) : []).map((r) => r.event_id);
    const slot_ids = (Array.isArray(slRows) ? (slRows as { slot_id: number }[]) : []).map((r) => r.slot_id);

    const coupon = { ...coupons[0], event_ids, slot_ids } as Coupon & { event_ids: string[]; slot_ids: number[] };

    const res = NextResponse.json(coupon);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// PUT - Update coupon and replace event/slot associations
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Coupon id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const body = await request.json();
    const {
      coupon_level,
      coupon_code,
      discount_type,
      discount_applicable,
      discount,
      coupon_inventory,
      group_size,
      affiliate_email,
      coupon_type,
      valid_from,
      valid_till,
      validity_type,
      company_id,
      event_ids,
      slot_ids,
    } = body;

    const updates: { field: string; value: unknown }[] = [];
    if (coupon_level !== undefined) updates.push({ field: 'coupon_level', value: coupon_level });
    if (coupon_code !== undefined) updates.push({ field: 'coupon_code', value: String(coupon_code).trim() });
    if (discount_type !== undefined) updates.push({ field: 'discount_type', value: discount_type });
    if (discount_applicable !== undefined) updates.push({ field: 'discount_applicable', value: discount_applicable });
    if (discount !== undefined) updates.push({ field: 'discount', value: Number(discount) });
    if (coupon_inventory !== undefined) updates.push({ field: 'coupon_inventory', value: Number(coupon_inventory) });
    if (group_size !== undefined) updates.push({ field: 'group_size', value: group_size == null || group_size === '' ? null : Number(group_size) });
    if (affiliate_email !== undefined) updates.push({ field: 'affiliate_email', value: affiliate_email && String(affiliate_email).trim() ? String(affiliate_email).trim() : null });
    if (coupon_type !== undefined) updates.push({ field: 'coupon_type', value: coupon_type });
    if (valid_from !== undefined) updates.push({ field: 'valid_from', value: valid_from && String(valid_from).trim() ? String(valid_from).trim() : null });
    if (valid_till !== undefined) updates.push({ field: 'valid_till', value: valid_till && String(valid_till).trim() ? String(valid_till).trim() : null });
    if (validity_type !== undefined) updates.push({ field: 'validity_type', value: validity_type });
    if (company_id !== undefined) updates.push({ field: 'company_id', value: company_id && String(company_id).trim() ? String(company_id).trim() : null });

    const db = await pool.getConnection();

    if (updates.length > 0) {
      const setClause = updates.map((u) => `${u.field} = ?`).join(', ');
      const values = updates.map((u) => u.value);
      const [result] = await db.execute(`UPDATE coupons SET ${setClause} WHERE id = ?`, [...values, id]);
      const updateResult = result as { affectedRows?: number };
      if (updateResult?.affectedRows === 0) {
        db.release();
        const res = NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        return addCorsHeaders(res, origin);
      }
    }

    const evIds = Array.isArray(event_ids) ? event_ids : undefined;
    const slIds = Array.isArray(slot_ids) ? slot_ids : undefined;

    if (evIds || slIds) {
      if (evIds) {
        await db.execute('DELETE FROM coupon_events WHERE coupon_id = ?', [id]);
        for (const eid of evIds) {
          if (eid) await db.execute('INSERT IGNORE INTO coupon_events (coupon_id, event_id) VALUES (?, ?)', [id, String(eid)]);
        }
      }
      if (slIds) {
        await db.execute('DELETE FROM coupon_slots WHERE coupon_id = ?', [id]);
        for (const sid of slIds) {
          if (sid != null) await db.execute('INSERT IGNORE INTO coupon_slots (coupon_id, slot_id) VALUES (?, ?)', [id, Number(sid)]);
        }
      }
    }

    db.release();

    const res = NextResponse.json({ message: 'Coupon updated successfully', id });
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

// DELETE - Delete coupon (cascades to coupon_events, coupon_slots via FK)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Coupon id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM coupons WHERE id = ?', [id]);
    db.release();

    const deleteResult = result as { affectedRows?: number };
    if (deleteResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Coupon deleted successfully' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
