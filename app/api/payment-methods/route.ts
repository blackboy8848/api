import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PaymentMethod } from '@/types/database';

// GET all payment methods or filtered by user_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (id) {
      const [rows] = await pool.execute(
        'SELECT * FROM payment_methods WHERE id = ?',
        [id]
      );
      const paymentMethods = rows as PaymentMethod[];
      if (Array.isArray(paymentMethods) && paymentMethods.length === 0) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
      }
      return NextResponse.json(paymentMethods[0]);
    }

    let query = 'SELECT * FROM payment_methods WHERE 1=1';
    const params: any[] = [];

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY added_at DESC';

    const [rows] = await pool.execute(query, params);
    const paymentMethods = rows as PaymentMethod[];
    return NextResponse.json(paymentMethods);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new payment method
export async function POST(request: NextRequest) {
  try {
    const body: PaymentMethod = await request.json();
    const { id, user_id, type } = body;

    if (!id || !user_id || !type) {
      return NextResponse.json(
        { error: 'id, user_id, and type are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO payment_methods (id, user_id, type, last4, card_type, upi_id, bank_name, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, user_id, type,
        body.last4 || null, body.card_type || null,
        body.upi_id || null, body.bank_name || null,
        body.is_default || false
      ]
    );

    return NextResponse.json({ message: 'Payment method created successfully', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update payment method
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<PaymentMethod> = await request.json();
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
      `UPDATE payment_methods SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: 'Payment method updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete payment method
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [result] = await pool.execute('DELETE FROM payment_methods WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Payment method deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

