import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { TourSlot } from '@/types/database';

// GET all tour slots or filtered by tour_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tour_id = searchParams.get('tour_id');

    const db = await pool.getConnection();

    if (id) {
      // Get single slot
      const [rows] = await db.execute(
        'SELECT * FROM tour_slots WHERE id = ?',
        [id]
      );
      db.release();
      const slots = rows as TourSlot[];
      if (Array.isArray(slots) && slots.length === 0) {
        return NextResponse.json({ error: 'Tour slot not found' }, { status: 404 });
      }
      return NextResponse.json(slots[0]);
    }

    // Build query for filters
    let query = 'SELECT * FROM tour_slots WHERE 1=1';
    const params: any[] = [];

    if (tour_id) {
      query += ' AND tour_id = ?';
      params.push(tour_id);
    }

    query += ' ORDER BY slot_date ASC, slot_time ASC';

    const [rows] = await db.execute(query, params);
    const slots = rows as TourSlot[];
    db.release();
    return NextResponse.json(slots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new tour slot
export async function POST(request: NextRequest) {
  try {
    const body: TourSlot = await request.json();
    const { tour_id, slot_date, slot_time, slot_end_date, total_capacity, duration_label } = body;

    if (!tour_id || !slot_date || !slot_time) {
      return NextResponse.json(
        { error: 'tour_id, slot_date, and slot_time are required' },
        { status: 400 }
      );
    }

    const db = await pool.getConnection();
    
    // Verify tour exists
    const [tourRows] = await db.execute(
      'SELECT id FROM tours WHERE id = ?',
      [tour_id]
    );
    const tours = tourRows as any[];
    if (Array.isArray(tours) && tours.length === 0) {
      db.release();
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const [result] = await db.execute(
      `INSERT INTO tour_slots (tour_id, slot_date, slot_time, slot_end_date, total_capacity, duration_label) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tour_id, slot_date, slot_time, slot_end_date || null, total_capacity ?? null, duration_label || null]
    );
    db.release();

    const insertResult = result as any;
    const slotId = insertResult.insertId;

    return NextResponse.json({ 
      message: 'Tour slot created successfully', 
      id: slotId 
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update tour slot
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<TourSlot> & { id: number } = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updateFields as any)[field]);

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `UPDATE tour_slots SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    db.release();

    return NextResponse.json({ message: 'Tour slot updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete tour slot
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM tour_slots WHERE id = ?', [id]);
    db.release();

    return NextResponse.json({ message: 'Tour slot deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

