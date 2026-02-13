import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { runWithTransaction, insertAuditLog } from '@/lib/db-helpers';
import { Booking } from '@/types/database';
import { randomUUID } from 'crypto';
import { sendBookingConfirmationEmail } from '@/lib/email';
import type { Connection } from 'mysql2/promise';

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

// GET all bookings or filtered by user_id, tour_id, status. Excludes soft-deleted (is_deleted = TRUE).
export async function GET(request: NextRequest) {
  let db: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const tour_id = searchParams.get('tour_id');
    const booking_status = searchParams.get('booking_status');
    const payment_status = searchParams.get('payment_status');
    const status = searchParams.get('status');
    const include_deleted = searchParams.get('include_deleted') === '1';

    db = await pool.getConnection();
    const notDeleted = include_deleted ? '' : ' AND (b.is_deleted = 0 OR b.is_deleted IS NULL)';

    if (id) {
      const [rows] = await db.execute(
        `SELECT * FROM bookings b WHERE b.id = ? ${notDeleted}`,
        [id]
      );
      db.release();
      db = null;
      const bookings = rows as Booking[];
      if (Array.isArray(bookings) && bookings.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      return NextResponse.json(bookings[0]);
    }

    let query = 'SELECT * FROM bookings b WHERE 1=1' + notDeleted;
    const params: (string | number)[] = [];

    if (user_id) {
      query += ' AND b.user_id = ?';
      params.push(user_id);
    }
    if (tour_id) {
      query += ' AND b.tour_id = ?';
      params.push(tour_id);
    }
    if (booking_status) {
      query += ' AND b.booking_status = ?';
      params.push(booking_status);
    } else if (status) {
      query += ' AND (b.status = ? OR b.booking_status = ?)';
      params.push(status, status);
    }
    if (payment_status) {
      query += ' AND b.payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY b.booking_date DESC, b.created_at DESC';

    const [rows] = await db.execute(query, params);
    const bookings = rows as Booking[];
    db.release();
    db = null;
    return NextResponse.json(bookings);
  } catch (error: unknown) {
    if (db) db.release();
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create new booking with availability check, transaction, and audit
export async function POST(request: NextRequest) {
  const body: Booking = await request.json();
  const {
    id, user_id, tour_id, slot_id, variant_id, seats,
    tour_name, customer_name, customer_email, phone_number, travel_date, total_amount,
    number_of_seats,
  } = body;

  const seatsValue = seats ?? number_of_seats;

  if (!user_id || !tour_id || !slot_id || !variant_id || seatsValue == null) {
    return NextResponse.json(
      { error: 'user_id, tour_id, slot_id, variant_id, and seats (or number_of_seats) are required' },
      { status: 400 }
    );
  }
  if (seatsValue <= 0) {
    return NextResponse.json(
      { error: 'seats must be greater than 0' },
      { status: 400 }
    );
  }

  let bookingId: string;
  try {
    bookingId = await runWithTransaction(async (conn: Connection) => {
      const [slotRows] = await conn.execute('SELECT id FROM tour_slots WHERE id = ?', [slot_id]);
      const slots = slotRows as { id: unknown }[];
      if (!Array.isArray(slots) || slots.length === 0) {
        throw new Error('Slot not found');
      }

      const [variantRows] = await conn.execute(
        'SELECT capacity FROM tour_slot_variants WHERE id = ? FOR UPDATE',
        [variant_id]
      );
      const variants = variantRows as { capacity: number }[];
      if (!Array.isArray(variants) || variants.length === 0) {
        throw new Error('Variant not found');
      }
      const variant = variants[0];

      const [availabilityRows] = await conn.execute(
        `SELECT v.capacity - IFNULL(SUM(b.seats), 0) AS available_seats
         FROM tour_slot_variants v
         LEFT JOIN bookings b ON v.id = b.variant_id
           AND (b.is_deleted = 0 OR b.is_deleted IS NULL)
           AND (b.booking_status = 'CONFIRMED' OR b.status IN ('confirmed', 'completed'))
         WHERE v.id = ?
         GROUP BY v.id`,
        [variant_id]
      );
      const availability = availabilityRows as { available_seats?: number }[];
      const availableSeats = availability[0]?.available_seats ?? variant.capacity;
      if (availableSeats < seatsValue) {
        throw new Error(`Not enough available seats: ${availableSeats} available, ${seatsValue} requested`);
      }

      const newId = id || randomUUID();
      await conn.execute(
        `INSERT INTO bookings (
          id, user_id, tour_id, slot_id, variant_id, seats,
          tour_name, travel_date, total_amount, status,
          booking_status, payment_status, settlement_status, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'CONFIRMED', 'UNPAID', 'NOT_SETTLED', 0)`,
        [
          newId, user_id, tour_id, slot_id, variant_id, seatsValue,
          tour_name || null, travel_date || null, total_amount ?? 0,
        ]
      );

      await insertAuditLog(conn, {
        entity_type: 'BOOKING',
        entity_id: newId,
        action_type: 'CREATE',
        new_data: { user_id, tour_id, slot_id, variant_id, seats: seatsValue, total_amount: total_amount ?? 0 },
        performed_by: user_id ?? null,
      });
      return newId;
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    if (message === 'Slot not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === 'Variant not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('Not enough available seats')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Send booking confirmation email (non-blocking, outside transaction)
  let recipientEmail: string | null =
    customer_email && typeof customer_email === 'string' && customer_email.trim()
      ? customer_email.trim()
      : null;
  if (!recipientEmail && user_id) {
    try {
      const conn = await pool.getConnection();
      const [userRows] = await conn.execute('SELECT email FROM users WHERE uid = ?', [user_id]);
      conn.release();
      const users = userRows as { email?: string }[];
      if (Array.isArray(users) && users[0]?.email) {
        recipientEmail = users[0].email;
      }
    } catch {
      // ignore
    }
  }
  let dateTimeLabel =
    travel_date && typeof travel_date === 'string' ? formatBookingDateTime(travel_date) : '';
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
      totalAmount: total_amount ?? 0,
    }).catch((err) => console.error('Booking confirmation email failed:', err));
  }

  return NextResponse.json(
    { message: 'Booking created successfully', id: bookingId },
    { status: 201 }
  );
}

// Allowed fields for PUT (never allow direct settlement_status update; use /api/bookings/adjustment)
const ALLOWED_PUT_FIELDS = new Set([
  'tour_name', 'customer_name', 'customer_email', 'phone_number', 'travel_date',
  'total_amount', 'notes', 'booking_status', 'payment_status', 'status',
]);

// PUT - Update booking (transaction + audit). Never modify settlements via this route.
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<Booking> = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const filtered = Object.fromEntries(
      Object.entries(updateFields).filter(([k]) => ALLOWED_PUT_FIELDS.has(k))
    );
    const fields = Object.keys(filtered);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No allowed fields to update' }, { status: 400 });
    }

    await runWithTransaction(async (conn: Connection) => {
      const [rows] = await conn.execute(
        'SELECT * FROM bookings WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [id]
      );
      const existing = rows as Record<string, unknown>[];
      if (!Array.isArray(existing) || existing.length === 0) {
        throw new Error('Booking not found or deleted');
      }
      const oldData = existing[0];

      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      const values = fields.map((f) => (filtered as Record<string, unknown>)[f]);
      await conn.execute(
        `UPDATE bookings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id]
      );

      const newData = { ...oldData, ...filtered };
      await insertAuditLog(conn, {
        entity_type: 'BOOKING',
        entity_id: id,
        action_type: 'UPDATE',
        old_data: oldData as Record<string, unknown>,
        new_data: newData as Record<string, unknown>,
        performed_by: (body as { performed_by?: string }).performed_by ?? null,
      });
    });

    return NextResponse.json({ message: 'Booking updated successfully', id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    if (message === 'Booking not found or deleted') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH - Cancel booking (sets booking_status = CANCELLED; never deletes)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await runWithTransaction(async (conn: Connection) => {
      const [rows] = await conn.execute(
        'SELECT id, booking_status, payment_status FROM bookings WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [id]
      );
      const bookings = rows as { booking_status?: string; payment_status?: string }[];
      if (!Array.isArray(bookings) || bookings.length === 0) {
        throw new Error('Booking not found or deleted');
      }
      const old = bookings[0];

      await conn.execute(
        `UPDATE bookings SET booking_status = 'CANCELLED', status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );

      await insertAuditLog(conn, {
        entity_type: 'BOOKING',
        entity_id: id,
        action_type: 'CANCEL',
        old_data: { booking_status: old.booking_status, payment_status: old.payment_status },
        new_data: { booking_status: 'CANCELLED' },
        performed_by: (body as { performed_by?: string }).performed_by ?? null,
      });
    });

    return NextResponse.json({ message: 'Booking cancelled successfully', id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    if (message === 'Booking not found or deleted') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Soft delete only (sets is_deleted = TRUE). Never physically delete bookings.
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const performed_by = searchParams.get('performed_by');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await runWithTransaction(async (conn: Connection) => {
      const [rows] = await conn.execute(
        'SELECT id, booking_status, payment_status FROM bookings WHERE id = ?',
        [id]
      );
      const bookings = rows as { booking_status?: string; payment_status?: string }[];
      if (!Array.isArray(bookings) || bookings.length === 0) {
        throw new Error('Booking not found');
      }
      const old = bookings[0];

      await conn.execute(
        'UPDATE bookings SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      await insertAuditLog(conn, {
        entity_type: 'BOOKING',
        entity_id: id,
        action_type: 'UPDATE',
        old_data: { ...old, is_deleted: false },
        new_data: { is_deleted: true },
        performed_by: performed_by ?? null,
      });
    });

    return NextResponse.json({ message: 'Booking soft-deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    if (message === 'Booking not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

