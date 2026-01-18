import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Lead } from '@/types/database';
import { addCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// OPTIONS - Handle preflight for Contact form (cross-origin)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

// GET - List leads with optional filters (search, lead_state, lead_source, lead_status, assigned_to, sort)
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search'); // name or email
    const lead_state = searchParams.get('lead_state'); // Hot, Warm, Cold
    const lead_source = searchParams.get('lead_source'); // other, manual, onelink
    const lead_status = searchParams.get('lead_status');
    const assigned_to = searchParams.get('assigned_to');
    const sort = searchParams.get('sort') || 'newest'; // newest | oldest

    const db = await pool.getConnection();

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params: (string | number)[] = [];

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }
    if (lead_state) {
      query += ' AND lead_state = ?';
      params.push(lead_state);
    }
    if (lead_source) {
      query += ' AND lead_source = ?';
      params.push(lead_source);
    }
    if (lead_status) {
      query += ' AND lead_status = ?';
      params.push(lead_status);
    }
    if (assigned_to) {
      query += ' AND assigned_to = ?';
      params.push(assigned_to);
    }

    query += sort === 'oldest' ? ' ORDER BY created_at ASC' : ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    const leads = rows as Lead[];
    db.release();

    const res = NextResponse.json(leads);
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}

// POST - Create lead (from Contact Us form or manual entry)
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
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
    } = body;

    if (!name || !email || !phone_number) {
      const res = NextResponse.json(
        { error: 'name, email, and phone_number are required' },
        { status: 400 }
      );
      return addCorsHeaders(res, origin);
    }

    const db = await pool.getConnection();
    const [result] = await db.execute(
      `INSERT INTO leads (
        name, email, phone_country_code, phone_number,
        lead_source, lead_state, lead_status, assigned_to,
        enquiry_destination, tour_id, event_id, slot_id, notes, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone_country_code ?? '91',
        phone_number,
        lead_source ?? 'other',
        lead_state ?? 'Cold',
        lead_status ?? 'New Enquiry',
        assigned_to ?? null,
        enquiry_destination ?? null,
        tour_id ?? null,
        event_id ?? null,
        slot_id ?? null,
        notes ?? null,
        remarks ?? null,
      ]
    );
    db.release();

    const insertResult = result as { insertId?: number };
    const id = insertResult?.insertId;

    const res = NextResponse.json({ message: 'Lead created successfully', id }, { status: 201 });
    return addCorsHeaders(res, origin);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const res = NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    return addCorsHeaders(res, request.headers.get('origin'));
  }
}
