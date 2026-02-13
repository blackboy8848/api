/**
 * GET /api/bookings/refund - List refunds (optionally by booking_id).
 * POST /api/bookings/refund - Request or process a refund. Inserts refund + transaction + audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { runWithTransaction, insertAuditLog } from '@/lib/db-helpers';
import type { RefundStatus } from '@/types/database';
import { randomUUID } from 'crypto';
import type { Connection } from 'mysql2/promise';

const REFUND_STATUSES: RefundStatus[] = ['REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED'];

interface RefundBody {
  booking_id: string;
  amount: number;
  reason?: string | null;
  status?: RefundStatus;
  performed_by?: string | null;
}

/** GET - Show refunds. Query: ?booking_id=xxx to filter by booking. */
export async function GET(request: NextRequest) {
  let conn: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const booking_id = searchParams.get('booking_id');

    conn = await pool.getConnection();
    let query = 'SELECT id, booking_id, amount, reason, status, created_at FROM refunds WHERE 1=1';
    const params: string[] = [];
    if (booking_id) {
      query += ' AND booking_id = ?';
      params.push(booking_id);
    }
    query += ' ORDER BY created_at DESC';

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
    const body: RefundBody = await request.json();
    const { booking_id, amount, reason, status = 'REQUESTED', performed_by } = body;

    if (!booking_id || amount == null || amount <= 0) {
      return NextResponse.json(
        { error: 'booking_id and positive amount are required' },
        { status: 400 }
      );
    }
    if (!REFUND_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Use one of: REQUESTED, APPROVED, PROCESSED, REJECTED' },
        { status: 400 }
      );
    }

    const result = await runWithTransaction(async (conn: Connection) => {
      const [rows] = await conn.execute(
        'SELECT id, payment_status FROM bookings WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [booking_id]
      );
      const bookings = rows as { id: string; payment_status?: string }[];
      if (!Array.isArray(bookings) || bookings.length === 0) {
        throw new Error('Booking not found or deleted');
      }

      const refundId = randomUUID();
      await conn.execute(
        `INSERT INTO refunds (id, booking_id, amount, reason, status) VALUES (?, ?, ?, ?, ?)`,
        [refundId, booking_id, amount, reason ?? null, status]
      );

      const txId = randomUUID();
      await conn.execute(
        `INSERT INTO transactions (id, booking_id, transaction_type, payment_method, amount, status)
         VALUES (?, ?, 'REFUND', 'MANUAL', ?, ?)`,
        [txId, booking_id, amount, status === 'PROCESSED' ? 'SUCCESS' : 'PENDING']
      );

      const newPaymentStatus = status === 'PROCESSED' ? 'REFUNDED' : 'REFUND_INITIATED';
      await conn.execute(
        `UPDATE bookings SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newPaymentStatus, booking_id]
      );

      await insertAuditLog(conn, {
        entity_type: 'REFUND',
        entity_id: refundId,
        action_type: 'REFUND',
        new_data: { booking_id, amount, reason, status, transaction_id: txId },
        performed_by: performed_by ?? null,
      });
      return { refund_id: refundId, transaction_id: txId, payment_status: newPaymentStatus };
    });

    return NextResponse.json({ message: 'Refund recorded', ...result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
