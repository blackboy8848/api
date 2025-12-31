import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { TourSlotVariant } from '@/types/database';

// GET all tour slot variants or filtered by slot_id or variant_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slot_id = searchParams.get('slot_id');

    const db = await pool.getConnection();

    if (id) {
      // Get single variant
      const [rows] = await db.execute(
        'SELECT * FROM tour_slot_variants WHERE id = ?',
        [id]
      );
      db.release();
      const variants = rows as TourSlotVariant[];
      if (Array.isArray(variants) && variants.length === 0) {
        return NextResponse.json({ error: 'Tour slot variant not found' }, { status: 404 });
      }
      return NextResponse.json(variants[0]);
    }

    // Build query for filters
    let query = 'SELECT * FROM tour_slot_variants WHERE 1=1';
    const params: any[] = [];

    if (slot_id) {
      query += ' AND slot_id = ?';
      params.push(slot_id);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await db.execute(query, params);
    const variants = rows as TourSlotVariant[];
    db.release();
    return NextResponse.json(variants);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new tour slot variant
export async function POST(request: NextRequest) {
  try {
    const body: TourSlotVariant = await request.json();
    const { slot_id, variant_name, description, price, capacity } = body;

    if (!slot_id || !variant_name || price === undefined || !capacity) {
      return NextResponse.json(
        { error: 'slot_id, variant_name, price, and capacity are required' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'price must be >= 0' },
        { status: 400 }
      );
    }

    if (capacity <= 0) {
      return NextResponse.json(
        { error: 'capacity must be > 0' },
        { status: 400 }
      );
    }

    const db = await pool.getConnection();
    
    // Verify slot exists
    const [slotRows] = await db.execute(
      'SELECT id FROM tour_slots WHERE id = ?',
      [slot_id]
    );
    const slots = slotRows as any[];
    if (Array.isArray(slots) && slots.length === 0) {
      db.release();
      return NextResponse.json({ error: 'Tour slot not found' }, { status: 404 });
    }

    const [result] = await db.execute(
      `INSERT INTO tour_slot_variants (slot_id, variant_name, description, price, capacity) 
       VALUES (?, ?, ?, ?, ?)`,
      [slot_id, variant_name, description || null, price, capacity]
    );
    db.release();

    const insertResult = result as any;
    const variantId = insertResult.insertId;

    return NextResponse.json({ 
      message: 'Tour slot variant created successfully', 
      id: variantId 
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json({ error: 'Tour slot not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update tour slot variant
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<TourSlotVariant> & { id: number } = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Validate price and capacity if provided
    if (updateFields.price !== undefined && updateFields.price < 0) {
      return NextResponse.json({ error: 'price must be >= 0' }, { status: 400 });
    }
    if (updateFields.capacity !== undefined && updateFields.capacity <= 0) {
      return NextResponse.json({ error: 'capacity must be > 0' }, { status: 400 });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updateFields as any)[field]);

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `UPDATE tour_slot_variants SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    db.release();

    return NextResponse.json({ message: 'Tour slot variant updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete tour slot variant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM tour_slot_variants WHERE id = ?', [id]);
    db.release();

    return NextResponse.json({ message: 'Tour slot variant deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

