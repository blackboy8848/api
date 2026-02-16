import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Tour } from '@/types/database';

// GET single tour by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 16 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 });
    }

    const db = await pool.getConnection();
    const [rows] = await db.execute(
      'SELECT * FROM tours WHERE id = ?',
      [id]
    );
    db.release();

    const tours = rows as Tour[];
    if (Array.isArray(tours) && tours.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tour = tours[0] as any;

    // Parse JSON fields that are stored as strings in the database
    if (tour.images && typeof tour.images === 'string') {
      try {
        tour.images = JSON.parse(tour.images);
      } catch (e) {
        tour.images = null;
      }
    }

    if (tour.startDates && typeof tour.startDates === 'string') {
      try {
        tour.startDates = JSON.parse(tour.startDates);
      } catch (e) {
        tour.startDates = null;
      }
    }

    if (tour.included && typeof tour.included === 'string') {
      try {
        tour.included = JSON.parse(tour.included);
      } catch (e) {
        tour.included = null;
      }
    }

    if (tour.notIncluded && typeof tour.notIncluded === 'string') {
      try {
        tour.notIncluded = JSON.parse(tour.notIncluded);
      } catch (e) {
        tour.notIncluded = null;
      }
    }

    if (tour.schedule && typeof tour.schedule === 'string') {
      try {
        tour.schedule = JSON.parse(tour.schedule);
      } catch (e) {
        tour.schedule = null;
      }
    }

    return NextResponse.json(tour);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update tour by id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 });
    }

    const body: Partial<Tour> = await request.json();
    const { ...updateFields } = body;

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map(field => {
      return `${field} = ?`;
    }).join(', ');

    const values = fields.map(field => {
      const value = (updateFields as any)[field];
      // Stringify JSON fields
      if (['images', 'startDates', 'included', 'notIncluded', 'schedule'].includes(field) && value) {
        return JSON.stringify(value);
      }
      // itinerary_pdf_url: allow null/empty to clear
      if (field === 'itinerary_pdf_url') {
        return value != null && String(value).trim() !== '' ? String(value).trim() : null;
      }
      return value;
    });

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `UPDATE tours SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    db.release();

    return NextResponse.json({ message: 'Tour updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete tour by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 });
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM tours WHERE id = ?', [id]);
    db.release();

    return NextResponse.json({ message: 'Tour deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
