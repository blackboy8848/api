import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { TravelHistory } from '@/types/database';

// GET all travel history or filtered by user_id or tour_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const tour_id = searchParams.get('tour_id');
    const status = searchParams.get('status');

    if (id) {
      const [rows] = await pool.execute(
        'SELECT * FROM travel_history WHERE id = ?',
        [id]
      );
      const travelHistory = rows as TravelHistory[];
      if (Array.isArray(travelHistory) && travelHistory.length === 0) {
        return NextResponse.json({ error: 'Travel history not found' }, { status: 404 });
      }
      return NextResponse.json(travelHistory[0]);
    }

    let query = 'SELECT * FROM travel_history WHERE 1=1';
    const params: any[] = [];

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    if (tour_id) {
      query += ' AND tour_id = ?';
      params.push(tour_id);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY travel_date DESC';

    const [rows] = await pool.execute(query, params);
    const travelHistory = rows as TravelHistory[];
    return NextResponse.json(travelHistory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new travel history
export async function POST(request: NextRequest) {
  try {
    const body: TravelHistory = await request.json();
    const { id, user_id, tour_id, tour_name, booking_date, travel_date } = body;

    if (!id || !user_id || !tour_id || !tour_name || !booking_date || !travel_date) {
      return NextResponse.json(
        { error: 'id, user_id, tour_id, tour_name, booking_date, and travel_date are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO travel_history (id, user_id, tour_id, tour_name, tour_image, booking_date, travel_date, status, rating, review) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, user_id, tour_id, tour_name, body.tour_image || null,
        booking_date, travel_date, body.status || 'upcoming',
        body.rating || null, body.review || null
      ]
    );

    return NextResponse.json({ message: 'Travel history created successfully', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update travel history
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<TravelHistory> = await request.json();
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

    const [result] = await pool.execute(
      `UPDATE travel_history SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: 'Travel history updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete travel history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [result] = await pool.execute('DELETE FROM travel_history WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Travel history deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

