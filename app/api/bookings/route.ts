import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Booking } from '@/types/database';

// GET all bookings or filtered by user_id, tour_id, or status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const tour_id = searchParams.get('tour_id');
    const booking_status = searchParams.get('booking_status');
    const payment_status = searchParams.get('payment_status');

    if (id) {
      const [rows] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ?',
        [id]
      );
      const bookings = rows as Booking[];
      if (Array.isArray(bookings) && bookings.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      return NextResponse.json(bookings[0]);
    }

    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    if (tour_id) {
      query += ' AND tour_id = ?';
      params.push(tour_id);
    }

    if (booking_status) {
      query += ' AND booking_status = ?';
      params.push(booking_status);
    }

    if (payment_status) {
      query += ' AND payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY booking_date DESC';

    const [rows] = await pool.execute(query, params);
    const bookings = rows as Booking[];
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
  try {
    const body: Booking = await request.json();
    const { id, user_id, tour_id, tour_name, customer_name, customer_email, phone_number, travel_date } = body;

    if (!id || !user_id || !tour_id || !tour_name || !customer_name || !customer_email || !phone_number || !travel_date) {
      return NextResponse.json(
        { error: 'id, user_id, tour_id, tour_name, customer_name, customer_email, phone_number, and travel_date are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO bookings (id, user_id, tour_id, tour_name, customer_name, customer_email, phone_number, 
        number_of_seats, payment_type, payment_proof, payment_status, booking_status, travel_date, 
        total_amount, payment_method_id, ticket_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, user_id, tour_id, tour_name, customer_name, customer_email, phone_number,
        body.number_of_seats || 1, body.payment_type || 'Full', body.payment_proof || null,
        body.payment_status || 'Not Verified', body.booking_status || 'Pending',
        travel_date, body.total_amount || 0, body.payment_method_id || null,
        body.ticket_id || null, body.notes || null
      ]
    );

    return NextResponse.json({ message: 'Booking created successfully', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update booking
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<Booking> = await request.json();
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
      `UPDATE bookings SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: 'Booking updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete booking
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [result] = await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

