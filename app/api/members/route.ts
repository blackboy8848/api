import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Member } from '@/types/database';
import { randomUUID } from 'crypto';

// GET - List members, optionally filtered by booking_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const booking_id = searchParams.get('booking_id');

    const db = await pool.getConnection();

    if (id) {
      const [rows] = await db.execute('SELECT * FROM members WHERE id = ?', [id]);
      db.release();
      const members = rows as Member[];
      if (Array.isArray(members) && members.length === 0) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }
      return NextResponse.json(members[0]);
    }

    let query = 'SELECT * FROM members WHERE 1=1';
    const params: string[] = [];
    if (booking_id) {
      query += ' AND booking_id = ?';
      params.push(booking_id);
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    const members = rows as Member[];
    db.release();
    return NextResponse.json(members);
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST - Create a member (name, mobile_number; optional booking_id)
export async function POST(request: NextRequest) {
  try {
    const body: Partial<Member> = await request.json();
    const { id: providedId, name, mobile_number, booking_id } = body;

    if (!name || !mobile_number) {
      return NextResponse.json(
        { error: 'name and mobile_number are required' },
        { status: 400 }
      );
    }

    const memberId = providedId || randomUUID();
    const db = await pool.getConnection();

    await db.execute(
      `INSERT INTO members (id, name, mobile_number, booking_id) VALUES (?, ?, ?, ?)`,
      [memberId, name.trim(), mobile_number.trim(), booking_id || null]
    );
    db.release();

    return NextResponse.json(
      { message: 'Member created successfully', id: memberId },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
