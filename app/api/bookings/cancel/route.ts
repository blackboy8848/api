/**
 * GET /api/bookings/cancel - List cancelled bookings (booking_status = CANCELLED).
 * POST /api/bookings/cancel - Cancel a booking (soft). Sets booking_status = CANCELLED.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { runWithTransaction, insertAuditLog } from '@/lib/db-helpers';
import type { Connection } from 'mysql2/promise';

interface CancelBody {
  booking_id: string;
  performed_by?: string | null;
}

/** GET - Show cancelled bookings. Query: ?user_id=xxx to filter by user. */
export async function GET(request: NextRequest) {
  let conn: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    conn = await pool.getConnection();
    let query = `SELECT id, user_id, tour_id, slot_id, variant_id, seats, tour_name, travel_date, total_amount,
                 booking_status, payment_status, created_at, updated_at
                 FROM bookings WHERE (booking_status = 'CANCELLED' OR status = 'cancelled') AND (is_deleted = 0 OR is_deleted IS NULL)`;
    const params: string[] = [];
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    query += ' ORDER BY updated_at DESC, created_at DESC';

    const [rows] = await conn.execute(query, params.length ? params : undefined);
    conn.release();
    conn = null;
    return NextResponse.json(rows);
  } catch (err: unknown) {
    if (conn) conn.release();
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CancelBody = await request.json();
    const { booking_id, performed_by } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
    }

    await runWithTransaction(async (conn: Connection) => {
      const [rows] = await conn.execute(
        'SELECT id, booking_status, payment_status FROM bookings WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [booking_id]
      );
      const bookings = rows as { id: string; booking_status?: string; payment_status?: string }[];
      if (!Array.isArray(bookings) || bookings.length === 0) {
        throw new Error('Booking not found or deleted');
      }
      const old = bookings[0];

      await conn.execute(
        `UPDATE bookings SET booking_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [booking_id]
      );

      await insertAuditLog(conn, {
        entity_type: 'BOOKING',
        entity_id: booking_id,
        action_type: 'CANCEL',
        old_data: { booking_status: old.booking_status, payment_status: old.payment_status },
        new_data: { booking_status: 'CANCELLED' },
        performed_by: performed_by ?? null,
      });
    });

    return NextResponse.json({ message: 'Booking cancelled', booking_id }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
