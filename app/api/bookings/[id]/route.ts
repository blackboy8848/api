import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/bookings/[id]
 * Returns a single booking with full details (booking + tour + slot info).
 * Use this route for "See all details" after booking confirmation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const db = await pool.getConnection();

    const [rows] = await db.execute(
      `SELECT 
        b.*,
        t.id AS tour_id_ref,
        t.title AS tour_title,
        t.description AS tour_description,
        t.duration AS tour_duration,
        t.price AS tour_price,
        t.location AS tour_location,
        t.imageUrl AS tour_image_url,
        t.banner AS tour_banner,
        s.id AS slot_id_ref,
        s.slot_date,
        s.slot_time,
        s.slot_end_date,
        s.duration_label AS slot_duration_label,
        v.id AS variant_id_ref,
        v.variant_name,
        v.description AS variant_description,
        v.price AS variant_price
      FROM bookings b
      LEFT JOIN tours t ON t.id = b.tour_id
      LEFT JOIN tour_slots s ON s.id = b.slot_id
      LEFT JOIN tour_slot_variants v ON v.id = b.variant_id
      WHERE b.id = ?`,
      [id]
    );
    db.release();

    const results = rows as any[];
    if (Array.isArray(results) && results.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const row = results[0];
    const booking: Record<string, unknown> = {
      id: row.id,
      user_id: row.user_id,
      tour_id: row.tour_id,
      slot_id: row.slot_id,
      variant_id: row.variant_id,
      seats: row.seats,
      tour_name: row.tour_name,
      travel_date: row.travel_date,
      total_amount: row.total_amount,
      status: row.status,
      created_at: row.created_at,
    };

    const details = {
      booking,
      tour: row.tour_id_ref
        ? {
            id: row.tour_id_ref,
            title: row.tour_title,
            description: row.tour_description,
            duration: row.tour_duration,
            price: row.tour_price,
            location: row.tour_location,
            imageUrl: row.tour_image_url,
            banner: row.tour_banner,
          }
        : null,
      slot: row.slot_id_ref
        ? {
            id: row.slot_id_ref,
            slot_date: row.slot_date,
            slot_time: row.slot_time,
            slot_end_date: row.slot_end_date,
            duration_label: row.slot_duration_label,
          }
        : null,
      variant: row.variant_id_ref
        ? {
            id: row.variant_id_ref,
            variant_name: row.variant_name,
            description: row.variant_description,
            price: row.variant_price,
          }
        : null,
    };

    return NextResponse.json(details);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
