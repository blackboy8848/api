import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PickupPoint } from '@/types/database';
import { randomUUID } from 'crypto';

// GET - List all pickup points or single by id; optional filter by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    const db = await pool.getConnection();

    if (id) {
      const [rows] = await db.execute('SELECT * FROM pickup_points WHERE id = ?', [id]);
      db.release();
      const points = rows as PickupPoint[];
      if (Array.isArray(points) && points.length === 0) {
        return NextResponse.json({ error: 'Pickup point not found' }, { status: 404 });
      }
      return NextResponse.json(points[0]);
    }

    let query = 'SELECT * FROM pickup_points WHERE 1=1';
    const params: string[] = [];
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY location_name ASC';

    const [rows] = await db.execute(query, params);
    const points = rows as PickupPoint[];
    db.release();
    return NextResponse.json(points);
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST - Create pickup point (location_name, map_link, status)
export async function POST(request: NextRequest) {
  try {
    const body: Partial<PickupPoint> = await request.json();
    const { id: providedId, location_name, map_link, status } = body;

    if (!location_name?.trim() || !map_link?.trim()) {
      return NextResponse.json(
        { error: 'location_name and map_link are required' },
        { status: 400 }
      );
    }

    const pointId = providedId || randomUUID();
    const statusValue = status === 'Inactive' ? 'Inactive' : 'Active';
    const db = await pool.getConnection();

    await db.execute(
      `INSERT INTO pickup_points (id, location_name, map_link, status) VALUES (?, ?, ?, ?)`,
      [pointId, location_name.trim(), map_link.trim(), statusValue]
    );
    db.release();

    return NextResponse.json(
      { message: 'Pickup point created successfully', id: pointId },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// PUT - Update pickup point
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<PickupPoint> = await request.json();
    const { id, location_name, map_link, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: (string | undefined)[] = [];

    if (location_name !== undefined) {
      updates.push('location_name = ?');
      values.push(location_name.trim());
    }
    if (map_link !== undefined) {
      updates.push('map_link = ?');
      values.push(map_link.trim());
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status === 'Inactive' ? 'Inactive' : 'Active');
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const db = await pool.getConnection();
    const [result] = await db.execute(
      `UPDATE pickup_points SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    const affected = (result as { affectedRows?: number }).affectedRows;
    db.release();

    if (affected === 0) {
      return NextResponse.json({ error: 'Pickup point not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Pickup point updated successfully', id });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete pickup point
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required (query: ?id=...)' }, { status: 400 });
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM pickup_points WHERE id = ?', [id]);
    const affected = (result as { affectedRows?: number }).affectedRows;
    db.release();

    if (affected === 0) {
      return NextResponse.json({ error: 'Pickup point not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Pickup point deleted successfully' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
