import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Favorite } from '@/types/database';

// GET all favorites or filtered by user_id or tour_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const tour_id = searchParams.get('tour_id');

    if (id) {
      const [rows] = await pool.execute(
        'SELECT * FROM favorites WHERE id = ?',
        [id]
      );
      const favorites = rows as Favorite[];
      if (Array.isArray(favorites) && favorites.length === 0) {
        return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
      }
      return NextResponse.json(favorites[0]);
    }

    let query = 'SELECT * FROM favorites WHERE 1=1';
    const params: any[] = [];

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    if (tour_id) {
      query += ' AND tour_id = ?';
      params.push(tour_id);
    }

    query += ' ORDER BY added_at DESC';

    const [rows] = await pool.execute(query, params);
    const favorites = rows as Favorite[];
    return NextResponse.json(favorites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new favorite
export async function POST(request: NextRequest) {
  try {
    const body: Favorite = await request.json();
    const { id, user_id, tour_id, tour_name } = body;

    if (!id || !user_id || !tour_id || !tour_name) {
      return NextResponse.json(
        { error: 'id, user_id, tour_id, and tour_name are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO favorites (id, user_id, tour_id, tour_name, tour_image) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, user_id, tour_id, tour_name, body.tour_image || null]
    );

    return NextResponse.json({ message: 'Favorite added successfully', id }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Favorite already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update favorite
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<Favorite> = await request.json();
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
      `UPDATE favorites SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: 'Favorite updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete favorite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [result] = await pool.execute('DELETE FROM favorites WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Favorite deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

