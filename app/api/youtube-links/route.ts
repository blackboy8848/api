/**
 * YouTube Links API (list + create).
 * GET /api/youtube-links — list with optional ?active=1|0
 * POST /api/youtube-links — create (body: url, title, description, thumbnail, sort_order, is_active)
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { YoutubeLink } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET — List YouTube links; optional ?active=1 or ?active=0
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');

    const db = await pool.getConnection();
    let query = 'SELECT * FROM youtube_links WHERE 1=1';
    const params: (string | number)[] = [];

    if (activeParam !== null && activeParam !== '') {
      const active = activeParam === '1' || activeParam === 'true' ? 1 : 0;
      query += ' AND is_active = ?';
      params.push(active);
    }

    query += ' ORDER BY sort_order ASC, id ASC';

    const [rows] = await db.execute(query, params);
    const list = rows as YoutubeLink[];
    db.release();

    const res = NextResponse.json(list);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// POST — Create YouTube link
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const {
      url,
      title,
      description,
      thumbnail,
      sort_order = 0,
      is_active = 1,
    } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      const res = NextResponse.json({ error: 'url is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      const res = NextResponse.json({ error: 'title is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `INSERT INTO youtube_links (url, title, description, thumbnail, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        url.trim(),
        title.trim(),
        description != null && description !== '' ? String(description).trim() : null,
        thumbnail != null && thumbnail !== '' ? String(thumbnail).trim() : null,
        Number(sort_order) || 0,
        is_active === true || is_active === 1 || is_active === '1' ? 1 : 0,
      ]
    );
    const insertResult = result as { insertId?: number };
    const id = insertResult?.insertId;
    db.release();

    if (!id) {
      const res = NextResponse.json({ error: 'Failed to create YouTube link' }, { status: 500 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'YouTube link created successfully', id }, { status: 201 });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
