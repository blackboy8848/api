/**
 * Subcategories API (list + create).
 * GET /api/subcategories — list; optional ?category_id=&active=1|0
 * POST /api/subcategories — create (body: category_id, name, image_url, is_active)
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Subcategory } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET — List subcategories; optional ?category_id= & ?active=1|0
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const categoryIdParam = searchParams.get('category_id');
    const activeParam = searchParams.get('active');

    const db = await pool.getConnection();
    let query = 'SELECT * FROM subcategories WHERE 1=1';
    const params: (string | number)[] = [];

    if (categoryIdParam !== null && categoryIdParam !== '') {
      query += ' AND category_id = ?';
      params.push(Number(categoryIdParam) || categoryIdParam);
    }
    if (activeParam !== null && activeParam !== '') {
      const active = activeParam === '1' || activeParam === 'true' ? 1 : 0;
      query += ' AND is_active = ?';
      params.push(active);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await db.execute(query, params);
    const list = rows as Subcategory[];
    db.release();

    const res = NextResponse.json(list);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// POST — Create subcategory
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const { category_id, name, image_url, is_active = 1 } = body;

    if (category_id == null || (typeof category_id !== 'number' && typeof category_id !== 'string')) {
      const res = NextResponse.json({ error: 'category_id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      const res = NextResponse.json({ error: 'name is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute(
      'INSERT INTO subcategories (category_id, name, image_url, is_active) VALUES (?, ?, ?, ?)',
      [
        Number(category_id),
        name.trim(),
        image_url != null && image_url !== '' ? String(image_url).trim() : null,
        is_active === true || is_active === 1 || is_active === '1' ? 1 : 0,
      ]
    );
    const insertResult = result as { insertId?: number };
    const id = insertResult?.insertId;
    db.release();

    if (!id) {
      const res = NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Subcategory created successfully', id }, { status: 201 });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
