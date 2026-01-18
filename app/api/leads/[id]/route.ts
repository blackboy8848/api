import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Lead } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

// GET - Single lead by id (View Details)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [rows] = await db.execute('SELECT * FROM leads WHERE id = ?', [id]);
    db.release();

    const leads = rows as Lead[];
    if (Array.isArray(leads) && leads.length === 0) {
      const res = NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json(leads[0]);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// PUT - Update lead (Edit Enquiry)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const body: Partial<Lead> = await request.json();
    const {
      name,
      email,
      phone_country_code,
      phone_number,
      lead_source,
      lead_state,
      lead_status,
      assigned_to,
      enquiry_destination,
      tour_id,
      event_id,
      slot_id,
      notes,
      remarks,
      converted_to_booking_id,
    } = body;

    const updates: { field: string; value: unknown }[] = [];
    if (name !== undefined) updates.push({ field: 'name', value: name });
    if (email !== undefined) updates.push({ field: 'email', value: email });
    if (phone_country_code !== undefined) updates.push({ field: 'phone_country_code', value: phone_country_code });
    if (phone_number !== undefined) updates.push({ field: 'phone_number', value: phone_number });
    if (lead_source !== undefined) updates.push({ field: 'lead_source', value: lead_source });
    if (lead_state !== undefined) updates.push({ field: 'lead_state', value: lead_state });
    if (lead_status !== undefined) updates.push({ field: 'lead_status', value: lead_status });
    if (assigned_to !== undefined) updates.push({ field: 'assigned_to', value: assigned_to });
    if (enquiry_destination !== undefined) updates.push({ field: 'enquiry_destination', value: enquiry_destination });
    if (tour_id !== undefined) updates.push({ field: 'tour_id', value: tour_id });
    if (event_id !== undefined) updates.push({ field: 'event_id', value: event_id });
    if (slot_id !== undefined) updates.push({ field: 'slot_id', value: slot_id });
    if (notes !== undefined) updates.push({ field: 'notes', value: notes });
    if (remarks !== undefined) updates.push({ field: 'remarks', value: remarks });
    if (converted_to_booking_id !== undefined) updates.push({ field: 'converted_to_booking_id', value: converted_to_booking_id });

    if (updates.length === 0) {
      const res = NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const setClause = updates.map((u) => `${u.field} = ?`).join(', ');
    const values = updates.map((u) => u.value);

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `UPDATE leads SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    db.release();

    const updateResult = result as { affectedRows?: number };
    if (updateResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Lead updated successfully', id });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// DELETE - Delete lead (Delete Enquiry)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  try {
    const resolved = await Promise.resolve(params);
    const id = resolved?.id;

    if (!id) {
      const res = NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute('DELETE FROM leads WHERE id = ?', [id]);
    db.release();

    const deleteResult = result as { affectedRows?: number };
    if (deleteResult?.affectedRows === 0) {
      const res = NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      return addCorsHeaders(res, origin);
    }

    const res = NextResponse.json({ message: 'Lead deleted successfully' });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
