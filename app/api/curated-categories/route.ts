/**
 * Curated Categories API (list + create).
 * GET /api/curated-categories — list with optional ?active=1|0
 * POST /api/curated-categories — create (body: name, image, tag, main_category, sub_category, sort_order, is_active)
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { CuratedCategory } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET — List curated categories; optional ?active=1 or ?active=0
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');

    const db = await pool.getConnection();
    let query = 'SELECT * FROM curated_categories WHERE 1=1';
    const params: (string | number)[] = [];

    if (activeParam !== null && activeParam !== '') {
      const active = activeParam === '1' || activeParam === 'true' ? 1 : 0;
      query += ' AND is_active = ?';
      params.push(active);
    }

    query += ' ORDER BY sort_order ASC, id ASC';

    const [rows] = await db.execute(query, params);
    const list = rows as CuratedCategory[];
    db.release();

    const res = NextResponse.json(list);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// POST — Create curated category
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const {
      name,
      image,
      tag,
      main_category,
      sub_category,
      sort_order = 0,
      is_active = 1,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      const res = NextResponse.json({ error: 'name is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `INSERT INTO curated_categories (name, image, tag, main_category, sub_category, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        image != null && image !== '' ? String(image).trim() : null,
        tag != null && tag !== '' ? String(tag).trim() : null,
        main_category != null && main_category !== '' ? String(main_category).trim() : null,
        sub_category != null && sub_category !== '' ? String(sub_category).trim() : null,
        Number(sort_order) || 0,
        is_active === true || is_active === 1 || is_active === '1' ? 1 : 0,
      ]
    );
    const insertResult = result as { insertId?: number };
    const id = insertResult?.insertId;
    db.release();

    if (!id) {
      const res = NextResponse.json({ error: 'Failed to create curated category' }, { status: 500 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Curated category created successfully', id }, { status: 201 });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
