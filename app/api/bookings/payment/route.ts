/**
 * POST /api/bookings/payment
 * Record a payment for a booking. Uses transaction + audit. Never overwrites existing transaction rows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runWithTransaction, insertAuditLog } from '@/lib/db-helpers';
import type { PaymentMethodEnum, PaymentStatus } from '@/types/database';
import { randomUUID } from 'crypto';
import type { Connection } from 'mysql2/promise';

const PAYMENT_METHODS: PaymentMethodEnum[] = ['ONLINE', 'MANUAL', 'UPI', 'CARD', 'BANK_TRANSFER'];

interface PaymentBody {
  booking_id: string;
  amount: number;
  payment_method: PaymentMethodEnum;
  /** Optional: set to PARTIALLY_PAID when paying in parts */
  set_payment_status?: PaymentStatus;
  performed_by?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentBody = await request.json();
    const { booking_id, amount, payment_method, set_payment_status, performed_by } = body;

    if (!booking_id || amount == null || amount <= 0) {
      return NextResponse.json(
        { error: 'booking_id and positive amount are required' },
        { status: 400 }
      );
    }
    if (!PAYMENT_METHODS.includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment_method. Use one of: ONLINE, MANUAL, UPI, CARD, BANK_TRANSFER' },
        { status: 400 }
      );
    }

    const result = await runWithTransaction(async (conn: Connection) => {
      const [rows] = await conn.execute(
        'SELECT id, total_amount, payment_status FROM bookings WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [booking_id]
      );
      const bookings = rows as { id: string; total_amount?: number; payment_status?: string }[];
      if (!Array.isArray(bookings) || bookings.length === 0) {
        throw new Error('Booking not found or deleted');
      }
      const booking = bookings[0];
      const newPaymentStatus = set_payment_status ?? (amount >= Number(booking.total_amount || 0) ? 'PAID' : 'PARTIALLY_PAID');

      const txId = randomUUID();
      await conn.execute(
        `INSERT INTO transactions (id, booking_id, transaction_type, payment_method, amount, status)
         VALUES (?, ?, 'PAYMENT', ?, ?, 'SUCCESS')`,
        [txId, booking_id, payment_method, amount]
      );

      await conn.execute(
        `UPDATE bookings SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newPaymentStatus, booking_id]
      );

      await insertAuditLog(conn, {
        entity_type: 'BOOKING',
        entity_id: booking_id,
        action_type: 'UPDATE',
        new_data: { transaction_id: txId, amount, payment_method, payment_status: newPaymentStatus },
        performed_by: performed_by ?? null,
      });
      return { transaction_id: txId, payment_status: newPaymentStatus };
    });

    return NextResponse.json({ message: 'Payment recorded', ...result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
