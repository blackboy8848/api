/**
 * GET /api/bookings/adjustment - List adjustment transactions (and optionally settlements).
 * POST /api/bookings/adjustment - Record an adjustment. Inserts transaction + optional settlement.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { runWithTransaction, insertAuditLog } from '@/lib/db-helpers';
import type { PaymentMethodEnum } from '@/types/database';
import { randomUUID } from 'crypto';
import type { Connection } from 'mysql2/promise';

const PAYMENT_METHODS: PaymentMethodEnum[] = ['ONLINE', 'MANUAL', 'UPI', 'CARD', 'BANK_TRANSFER'];

interface SettlementInput {
  gross_amount: number;
  vendor_cost: number;
  commission: number;
  processing_fee: number;
  deduction: number;
  net_amount: number;
}

interface AdjustmentBody {
  booking_id: string;
  amount: number;
  payment_method: PaymentMethodEnum;
  /** Optional: create a new settlement record (never update existing). */
  settlement?: SettlementInput;
  performed_by?: string | null;
}

/** GET - Show adjustment transactions. Query: ?booking_id=xxx to filter by booking. */
export async function GET(request: NextRequest) {
  let conn: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const booking_id = searchParams.get('booking_id');

    conn = await pool.getConnection();
    let query = "SELECT id, booking_id, transaction_type, payment_method, amount, status, created_at FROM transactions WHERE transaction_type = 'ADJUSTMENT'";
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
    const body: AdjustmentBody = await request.json();
    const { booking_id, amount, payment_method, settlement, performed_by } = body;

    if (!booking_id || amount == null) {
      return NextResponse.json(
        { error: 'booking_id and amount are required' },
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
        'SELECT id FROM bookings WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
        [booking_id]
      );
      const bookings = rows as { id: string }[];
      if (!Array.isArray(bookings) || bookings.length === 0) {
        throw new Error('Booking not found or deleted');
      }

      const txId = randomUUID();
      await conn.execute(
        `INSERT INTO transactions (id, booking_id, transaction_type, payment_method, amount, status)
         VALUES (?, ?, 'ADJUSTMENT', ?, ?, 'SUCCESS')`,
        [txId, booking_id, payment_method, amount]
      );

      let settlementId: string | null = null;
      if (settlement) {
        const s = settlement;
        settlementId = randomUUID();
        await conn.execute(
          `INSERT INTO settlements (id, booking_id, gross_amount, vendor_cost, commission, processing_fee, deduction, net_amount, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
          [
            settlementId,
            booking_id,
            s.gross_amount,
            s.vendor_cost,
            s.commission,
            s.processing_fee,
            s.deduction,
            s.net_amount,
          ]
        );
      }

      await insertAuditLog(conn, {
        entity_type: 'BOOKING',
        entity_id: booking_id,
        action_type: 'ADJUSTMENT',
        new_data: { transaction_id: txId, amount, payment_method, settlement_id: settlementId },
        performed_by: performed_by ?? null,
      });
      return { transaction_id: txId, settlement_id: settlementId };
    });

    return NextResponse.json({ message: 'Adjustment recorded', ...result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
