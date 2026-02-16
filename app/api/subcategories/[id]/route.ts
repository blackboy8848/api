/**
 * Subcategories API (get one, update, delete).
 * GET /api/subcategories/:id — get one
 * PUT /api/subcategories/:id — update
 * DELETE /api/subcategories/:id — delete
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Subcategory } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

async function resolveId(params: RouteParams['params']): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved?.id ?? '';
}

// GET — Get one subcategory by id
export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [rows] = await db.execute('SELECT * FROM subcategories WHERE id = ?', [id]);
    const list = rows as Subcategory[];
    db.release();

    if (Array.isArray(list) && list.length === 0) {
      const res = NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
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

// PUT — Update subcategory
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const body = await request.json();
    const { category_id, name, image_url, is_active } = body;

    const updates: { field: string; value: unknown }[] = [];
    if (category_id !== undefined) updates.push({ field: 'category_id', value: Number(category_id) });
    if (name !== undefined) updates.push({ field: 'name', value: String(name).trim() });
    if (image_url !== undefined) updates.push({ field: 'image_url', value: image_url == null || image_url === '' ? null : String(image_url).trim() });
    if (is_active !== undefined) updates.push({ field: 'is_active', value: is_active === true || is_active === 1 || is_active === '1' ? 1 : 0 });

    if (updates.length === 0) {
      const res = NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const setClause = updates.map((u) => `${u.field} = ?`).join(', ');
    const values = updates.map((u) => u.value);
    const [result] = await db.execute(`UPDATE subcategories SET ${setClause} WHERE id = ?`, [...values, id]);
    const updateResult = result as { affectedRows?: number };
    db.release();

    if (updateResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Subcategory updated successfully', id });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// DELETE — Delete subcategory
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM subcategories WHERE id = ?', [id]);
    const deleteResult = result as { affectedRows?: number };
    db.release();

    if (deleteResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Subcategory deleted successfully' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
