import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Booking } from '@/types/database';
import { randomUUID } from 'crypto';
import { sendBookingConfirmationEmail } from '@/lib/email';

function formatBookingDateTime(travelDate: string): string {
  const d = new Date(travelDate);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const isTomorrow = d.getDate() === today.getDate() + 1 && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const dateStr = isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr} at ${timeStr}`;
}

function formatSlotDateTime(slotDate?: string, slotTime?: string): string {
  if (!slotDate) return '';
  const d = slotDate && slotTime ? new Date(`${slotDate}T${slotTime}`) : new Date(slotDate);
  if (Number.isNaN(d.getTime())) return slotDate;
  const today = new Date();
  const isTomorrow = d.getDate() === today.getDate() + 1 && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const dateStr = isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr} at ${timeStr}`;
}

// GET all bookings or filtered by user_id, tour_id, or status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const tour_id = searchParams.get('tour_id');
    const booking_status = searchParams.get('booking_status');
    const payment_status = searchParams.get('payment_status');
    const status = searchParams.get('status'); // Alternative status field

    const db = await pool.getConnection();

    if (id) {
      const [rows] = await db.execute(
        'SELECT * FROM bookings WHERE id = ?',
        [id]
      );
      db.release();
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

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (payment_status) {
      query += ' AND payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY booking_date DESC, created_at DESC';

    const [rows] = await db.execute(query, params);
    const bookings = rows as Booking[];
    db.release();
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new booking with availability check and transaction
export async function POST(request: NextRequest) {
  const db = await pool.getConnection();
  
  try {
    await db.beginTransaction();
    
    const body: Booking = await request.json();
    const { 
      id, user_id, tour_id, slot_id, variant_id, seats,
      tour_name, customer_name, customer_email, phone_number, travel_date, total_amount,
      number_of_seats
    } = body;

    // Map number_of_seats to seats if provided
    const seatsValue = seats || number_of_seats;

    // Validate required fields
    if (!user_id || !tour_id || !slot_id || !variant_id || !seatsValue) {
      await db.rollback();
      db.release();
      return NextResponse.json(
        { error: 'user_id, tour_id, slot_id, variant_id, and seats (or number_of_seats) are required' },
        { status: 400 }
      );
    }

    if (seatsValue <= 0) {
      await db.rollback();
      db.release();
      return NextResponse.json(
        { error: 'seats must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify slot exists
    const [slotRows] = await db.execute(
      'SELECT id FROM tour_slots WHERE id = ?',
      [slot_id]
    );
    const slots = slotRows as any[];
    if (Array.isArray(slots) && slots.length === 0) {
      await db.rollback();
      db.release();
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Lock variant row for update to prevent race conditions
    const [variantRows] = await db.execute(
      'SELECT capacity FROM tour_slot_variants WHERE id = ? FOR UPDATE',
      [variant_id]
    );
    const variants = variantRows as any[];
    
    if (Array.isArray(variants) && variants.length === 0) {
      await db.rollback();
      db.release();
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const variant = variants[0];

    // Check availability
    const [availabilityRows] = await db.execute(
      `SELECT 
        v.capacity - IFNULL(SUM(b.seats), 0) AS available_seats
       FROM tour_slot_variants v
       LEFT JOIN bookings b
         ON v.id = b.variant_id
         AND b.status IN ('confirmed', 'completed')
       WHERE v.id = ?
       GROUP BY v.id`,
      [variant_id]
    );
    
    const availability = availabilityRows as any[];
    const availableSeats = availability[0]?.available_seats ?? variant.capacity;

    if (availableSeats < seatsValue) {
      await db.rollback();
      db.release();
      return NextResponse.json(
        { 
          error: 'Not enough available seats',
          available_seats: availableSeats,
          requested_seats: seatsValue
        },
        { status: 400 }
      );
    }

    // Generate UUID if not provided
    const bookingId = id || randomUUID();

    // Create booking
    await db.execute(
      `INSERT INTO bookings (
        id, user_id, tour_id, slot_id, variant_id, seats,
        tour_name, travel_date, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [
        bookingId, user_id, tour_id, slot_id, variant_id, seatsValue,
        tour_name || null, travel_date || null, total_amount || 0
      ]
    );

    await db.commit();
    db.release();

    // Send booking confirmation email (non-blocking)
    let recipientEmail: string | null = (customer_email && typeof customer_email === 'string' && customer_email.trim())
      ? customer_email.trim()
      : null;
    if (!recipientEmail && user_id) {
      try {
        const conn = await pool.getConnection();
        const [userRows] = await conn.execute(
          'SELECT email FROM users WHERE uid = ?',
          [user_id]
        );
        conn.release();
        const users = userRows as { email?: string }[];
        if (Array.isArray(users) && users[0]?.email) {
          recipientEmail = users[0].email;
        }
      } catch {
        // ignore
      }
    }
    let dateTimeLabel = (travel_date && typeof travel_date === 'string') ? formatBookingDateTime(travel_date) : '';
    if (!dateTimeLabel && slot_id) {
      try {
        const conn = await pool.getConnection();
        const [slotRows] = await conn.execute(
          'SELECT slot_date, slot_time FROM tour_slots WHERE id = ?',
          [slot_id]
        );
        conn.release();
        const slots = slotRows as { slot_date?: string; slot_time?: string }[];
        if (Array.isArray(slots) && slots[0]) {
          dateTimeLabel = formatSlotDateTime(slots[0].slot_date, slots[0].slot_time);
        }
      } catch {
        // ignore
      }
    }
    if (!dateTimeLabel) dateTimeLabel = 'See booking details for date and time.';
    if (recipientEmail) {
      sendBookingConfirmationEmail(recipientEmail, {
        bookingId,
        guestCount: seatsValue,
        dateTime: dateTimeLabel,
        tourName: tour_name || undefined,
        totalAmount: total_amount,
      }).catch((err) => console.error('Booking confirmation email failed:', err));
    }

    return NextResponse.json({ 
      message: 'Booking created successfully', 
      id: bookingId 
    }, { status: 201 });
  } catch (error: any) {
    await db.rollback();
    db.release();
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

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `UPDATE bookings SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    db.release();

    return NextResponse.json({ message: 'Booking updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Cancel booking (releases seats)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = await pool.getConnection();
    
    // Update booking status to cancelled
    // Seats are automatically freed because availability only counts confirmed/completed bookings
    const [result] = await db.execute(
      `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,
      [id]
    );
    db.release();

    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Booking cancelled successfully', id });
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

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM bookings WHERE id = ?', [id]);
    db.release();

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

