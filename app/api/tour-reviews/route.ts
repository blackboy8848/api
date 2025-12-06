import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { TourReview } from '@/types/database';

// GET all reviews or filtered by tour_id or user_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tour_id = searchParams.get('tour_id');
    const user_id = searchParams.get('user_id');

    if (id) {
      const [rows] = await pool.execute(
        'SELECT * FROM tour_reviews WHERE id = ?',
        [id]
      );
      const reviews = rows as TourReview[];
      if (Array.isArray(reviews) && reviews.length === 0) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }
      return NextResponse.json(reviews[0]);
    }

    let query = 'SELECT * FROM tour_reviews WHERE 1=1';
    const params: any[] = [];

    if (tour_id) {
      query += ' AND tour_id = ?';
      params.push(tour_id);
    }

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    const reviews = rows as TourReview[];
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new review
export async function POST(request: NextRequest) {
  try {
    const body: TourReview = await request.json();
    const { id, tour_id, user_id, user_name, rating, comment } = body;

    if (!id || !tour_id || !user_name || !rating || !comment) {
      return NextResponse.json(
        { error: 'id, tour_id, user_name, rating, and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO tour_reviews (id, tour_id, user_id, user_name, user_email, user_photo_url, rating, comment, title) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tour_id, user_id || null, user_name,
        body.user_email || null, body.user_photo_url || null,
        rating, comment, body.title || null
      ]
    );

    return NextResponse.json({ message: 'Review created successfully', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update review
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<TourReview> = await request.json();
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
      `UPDATE tour_reviews SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: 'Review updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete review
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [result] = await pool.execute('DELETE FROM tour_reviews WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

