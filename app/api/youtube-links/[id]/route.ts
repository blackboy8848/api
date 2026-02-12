/**
 * YouTube Links API (get one, update, delete).
 * GET /api/youtube-links/:id — get one
 * PUT /api/youtube-links/:id — update
 * DELETE /api/youtube-links/:id — delete
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { YoutubeLink } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

async function resolveId(params: RouteParams['params']): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved?.id ?? '';
}

// GET — Get one YouTube link by id
export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [rows] = await db.execute('SELECT * FROM youtube_links WHERE id = ?', [id]);
    const list = rows as YoutubeLink[];
    db.release();

    if (Array.isArray(list) && list.length === 0) {
      const res = NextResponse.json({ error: 'YouTube link not found' }, { status: 404 });
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

// PUT — Update YouTube link
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const body = await request.json();
    const { url, title, description, thumbnail, sort_order, is_active } = body;

    const updates: { field: string; value: unknown }[] = [];
    if (url !== undefined) updates.push({ field: 'url', value: String(url).trim() });
    if (title !== undefined) updates.push({ field: 'title', value: String(title).trim() });
    if (description !== undefined) updates.push({ field: 'description', value: description == null || description === '' ? null : String(description).trim() });
    if (thumbnail !== undefined) updates.push({ field: 'thumbnail', value: thumbnail == null || thumbnail === '' ? null : String(thumbnail).trim() });
    if (sort_order !== undefined) updates.push({ field: 'sort_order', value: Number(sort_order) || 0 });
    if (is_active !== undefined) updates.push({ field: 'is_active', value: is_active === true || is_active === 1 || is_active === '1' ? 1 : 0 });

    if (updates.length === 0) {
      const res = NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const setClause = updates.map((u) => `${u.field} = ?`).join(', ');
    const values = updates.map((u) => u.value);
    const [result] = await db.execute(`UPDATE youtube_links SET ${setClause} WHERE id = ?`, [...values, id]);
    const updateResult = result as { affectedRows?: number };
    db.release();

    if (updateResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'YouTube link not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'YouTube link updated successfully', id });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// DELETE — Delete YouTube link
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const id = await resolveId(params);
    if (!id) {
      const res = NextResponse.json({ error: 'id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM youtube_links WHERE id = ?', [id]);
    const deleteResult = result as { affectedRows?: number };
    db.release();

    if (deleteResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'YouTube link not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'YouTube link deleted successfully' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
