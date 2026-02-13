/**
 * POST /api/bookings/cancel
 * Cancel a booking (soft). Sets booking_status = CANCELLED. Never deletes the row.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runWithTransaction, insertAuditLog } from '@/lib/db-helpers';
import type { Connection } from 'mysql2/promise';

interface CancelBody {
  booking_id: string;
  performed_by?: string | null;
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
