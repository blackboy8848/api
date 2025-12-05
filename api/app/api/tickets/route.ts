import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Ticket } from '@/types/database';

// GET all tickets or filtered by user_id or event_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticket_id = searchParams.get('ticket_id');
    const user_id = searchParams.get('user_id');
    const event_id = searchParams.get('event_id');
    const status = searchParams.get('status');

    if (ticket_id) {
      const [rows] = await pool.execute<Ticket[]>(
        'SELECT * FROM tickets WHERE ticket_id = ?',
        [ticket_id]
      );
      if (Array.isArray(rows) && rows.length === 0) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params: any[] = [];

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    if (event_id) {
      query += ' AND event_id = ?';
      params.push(event_id);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<Ticket[]>(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const body: Ticket = await request.json();
    const { ticket_id, user_id, user_name, event_id, event_name, valid_until } = body;

    if (!ticket_id || !user_id || !user_name || !event_id || !event_name || !valid_until) {
      return NextResponse.json(
        { error: 'ticket_id, user_id, user_name, event_id, event_name, and valid_until are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO tickets (ticket_id, user_id, user_name, event_id, event_name, status, valid_until) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ticket_id, user_id, user_name, event_id, event_name, body.status || 'booked', valid_until]
    );

    return NextResponse.json({ message: 'Ticket created successfully', ticket_id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update ticket
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<Ticket> = await request.json();
    const { ticket_id, ...updateFields } = body;

    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
    }

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updateFields as any)[field]);

    const [result] = await pool.execute(
      `UPDATE tickets SET ${setClause} WHERE ticket_id = ?`,
      [...values, ticket_id]
    );

    return NextResponse.json({ message: 'Ticket updated successfully', ticket_id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete ticket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticket_id = searchParams.get('ticket_id');

    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
    }

    const [result] = await pool.execute('DELETE FROM tickets WHERE ticket_id = ?', [ticket_id]);

    return NextResponse.json({ message: 'Ticket deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

