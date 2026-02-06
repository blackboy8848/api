/**
 * Curated Categories API (get one, update, delete).
 * GET /api/curated-categories/:id — get one
 * PUT /api/curated-categories/:id — update
 * DELETE /api/curated-categories/:id — delete
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { CuratedCategory } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

async function resolveId(params: RouteParams['params']): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved?.id ?? '';
}

// GET — Get one curated category by id
export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [rows] = await db.execute('SELECT * FROM curated_categories WHERE id = ?', [id]);
    const list = rows as CuratedCategory[];
    db.release();

    if (Array.isArray(list) && list.length === 0) {
      const res = NextResponse.json({ error: 'Curated category not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json(list[0]);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// PUT — Update curated category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const body = await request.json();
    const { name, image, tag, main_category, sub_category, sort_order, is_active } = body;

    const updates: { field: string; value: unknown }[] = [];
    if (name !== undefined) updates.push({ field: 'name', value: String(name).trim() });
    if (image !== undefined) updates.push({ field: 'image', value: image == null || image === '' ? null : String(image).trim() });
    if (tag !== undefined) updates.push({ field: 'tag', value: tag == null || tag === '' ? null : String(tag).trim() });
    if (main_category !== undefined) updates.push({ field: 'main_category', value: main_category == null || main_category === '' ? null : String(main_category).trim() });
    if (sub_category !== undefined) updates.push({ field: 'sub_category', value: sub_category == null || sub_category === '' ? null : String(sub_category).trim() });
    if (sort_order !== undefined) updates.push({ field: 'sort_order', value: Number(sort_order) || 0 });
    if (is_active !== undefined) updates.push({ field: 'is_active', value: is_active === true || is_active === 1 || is_active === '1' ? 1 : 0 });

    if (updates.length === 0) {
      const res = NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const setClause = updates.map((u) => `${u.field} = ?`).join(', ');
    const values = updates.map((u) => u.value);
    const [result] = await db.execute(`UPDATE curated_categories SET ${setClause} WHERE id = ?`, [...values, id]);
    const updateResult = result as { affectedRows?: number };
    db.release();

    if (updateResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Curated category not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Curated category updated successfully', id });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// DELETE — Delete curated category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM curated_categories WHERE id = ?', [id]);
    const deleteResult = result as { affectedRows?: number };
    db.release();

    if (deleteResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Curated category not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Curated category deleted successfully' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
