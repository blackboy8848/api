import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Tour } from '@/types/database';

// Helper function to parse JSON fields from database
function parseTourJsonFields(tour: any): any {
  const parsed = { ...tour };

  // Parse JSON fields that are stored as strings in the database
  const jsonFields = ['images', 'startDates', 'included', 'notIncluded', 'schedule'];
  
  jsonFields.forEach(field => {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        parsed[field] = null;
      }
    }
  });

  return parsed;
}

// GET all tours or single tour by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const db = await pool.getConnection();

    if (id) {
      // Get single tour
      const [rows] = await db.execute(
        'SELECT * FROM tours WHERE id = ?',
        [id]
      );
      db.release();
      const tours = rows as Tour[];
      if (Array.isArray(tours) && tours.length === 0) {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
      }
      const tour = parseTourJsonFields(tours[0]);
      return NextResponse.json(tour);
    }

    // Build query for filters
    let query = 'SELECT * FROM tours WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (isActive !== null) {
      query += ' AND isActive = ?';
      params.push(isActive === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    const tours = rows as Tour[];
    db.release();
    
    // Parse JSON fields for all tours
    const parsedTours = tours.map(tour => parseTourJsonFields(tour));
    return NextResponse.json(parsedTours);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new tour
export async function POST(request: NextRequest) {
  try {
    const body: Tour = await request.json();
    const {
      id, title, description, duration, price, imageUrl, location,
      category, subCategory, difficulty, maxGroupSize, isActive
    } = body;

    if (!id || !title || !description || !duration || !imageUrl || !location || !category || !subCategory) {
      return NextResponse.json(
        { error: 'id, title, description, duration, imageUrl, location, category, and subCategory are required' },
        { status: 400 }
      );
    }

    const itineraryPdfUrl = body.itinerary_pdf_url != null && String(body.itinerary_pdf_url).trim() !== ''
      ? String(body.itinerary_pdf_url).trim()
      : null;

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `INSERT INTO tours (id, title, subdescription, description, duration, price, difficulty, imageUrl, images, 
        location, lat, lng, maxGroupSize, startDates, included, notIncluded, category, subCategory, 
        isWeekendTrip, schedule, itinerary_pdf_url, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, body.subdescription || null, description, duration,
        price || 0, difficulty || 'Moderate', imageUrl, body.images ? JSON.stringify(body.images) : null,
        location, body.lat || null, body.lng || null, maxGroupSize || 20,
        body.startDates ? JSON.stringify(body.startDates) : null,
        body.included ? JSON.stringify(body.included) : null,
        body.notIncluded ? JSON.stringify(body.notIncluded) : null,
        category, subCategory, body.isWeekendTrip || false,
        body.schedule ? JSON.stringify(body.schedule) : null,
        itineraryPdfUrl,
        isActive !== undefined ? isActive : true
      ]
    );
    db.release();

    return NextResponse.json({ message: 'Tour created successfully', id }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Tour already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update tour
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<Tour> = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map(field => {
      // Handle JSON fields
      if (['images', 'startDates', 'included', 'notIncluded', 'schedule'].includes(field)) {
        return `${field} = ?`;
      }
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

// DELETE - Delete tour
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM tours WHERE id = ?', [id]);
    db.release();

    return NextResponse.json({ message: 'Tour deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

