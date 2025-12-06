import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Event } from '@/types/database';

// GET all events or single event by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const is_active = searchParams.get('is_active');

    if (id) {
      const [rows] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [id]
      );
      const events = rows as Event[];
      if (Array.isArray(events) && events.length === 0) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json(events[0]);
    }

    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (is_active !== null) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY date ASC';

    const [rows] = await pool.execute(query, params);
    const events = rows as Event[];
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const body: Event = await request.json();
    const { id, title, description, date, location, imageUrl, category, team_leader } = body;

    if (!id || !title || !description || !date || !location || !imageUrl || !category || !team_leader) {
      return NextResponse.json(
        { error: 'id, title, description, date, location, imageUrl, category, and team_leader are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO events (id, title, description, date, location, imageUrl, images, price, capacity, 
        registered_count, category, highlights, participants, team_leader, sections, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, description, date, location, imageUrl,
        body.images ? JSON.stringify(body.images) : null,
        body.price || 0, body.capacity || 50, body.registered_count || 0,
        category, body.highlights ? JSON.stringify(body.highlights) : null,
        body.participants ? JSON.stringify(body.participants) : null,
        team_leader, body.sections ? JSON.stringify(body.sections) : null,
        body.is_active !== undefined ? body.is_active : true
      ]
    );

    return NextResponse.json({ message: 'Event created successfully', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update event
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<Event> = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map(field => {
      if (['images', 'highlights', 'participants', 'sections'].includes(field)) {
        return `${field} = ?`;
      }
      return `${field} = ?`;
    }).join(', ');

    const values = fields.map(field => {
      const value = (updateFields as any)[field];
      if (['images', 'highlights', 'participants', 'sections'].includes(field) && value) {
        return JSON.stringify(value);
      }
      return value;
    });

    const [result] = await pool.execute(
      `UPDATE events SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: 'Event updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

