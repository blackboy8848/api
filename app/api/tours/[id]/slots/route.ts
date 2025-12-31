import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET tour slots with availability for a specific tour
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 16 compatibility)
    const resolvedParams = await Promise.resolve(params);
    
    // Extract tour_id from params or URL path
    let tour_id = resolvedParams?.id;
    
    if (!tour_id) {
      // Fallback: extract from URL path
      const url = new URL(request.url);
      const match = url.pathname.match(/\/tours\/([^/]+)\/slots/);
      if (match && match[1]) {
        tour_id = match[1];
      }
    }

    if (!tour_id) {
      return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 });
    }

    const db = await pool.getConnection();

    // Verify tour exists
    const [tourRows] = await db.execute(
      'SELECT id FROM tours WHERE id = ?',
      [tour_id]
    );
    const tours = tourRows as any[];
    if (Array.isArray(tours) && tours.length === 0) {
      db.release();
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Get slots with variants and availability
    const [rows] = await db.execute(
      `SELECT
        s.id AS slot_id,
        s.slot_date,
        s.slot_time,
        s.duration_label,
        v.id AS variant_id,
        v.variant_name,
        v.description AS variant_description,
        v.price,
        v.capacity,
        (v.capacity - IFNULL(SUM(CASE 
          WHEN b.status IN ('confirmed', 'completed') 
          THEN b.seats ELSE 0 END), 0)) AS available_seats,
        CASE
          WHEN (v.capacity - IFNULL(SUM(CASE 
            WHEN b.status IN ('confirmed', 'completed') 
            THEN b.seats ELSE 0 END), 0)) > 0
          THEN 'Available'
          ELSE 'Sold Out'
        END AS availability
      FROM tour_slots s
      JOIN tour_slot_variants v ON s.id = v.slot_id
      LEFT JOIN bookings b
        ON b.variant_id = v.id
        AND b.status IN ('confirmed', 'completed')
      WHERE s.tour_id = ?
      GROUP BY v.id, s.id
      ORDER BY s.slot_date ASC, s.slot_time ASC, v.id ASC`,
      [tour_id]
    );

    db.release();

    // Transform results into a more structured format
    const slots = rows as any[];
    
    // Group by slot
    const slotsMap = new Map();
    
    slots.forEach((row: any) => {
      const slotKey = `${row.slot_id}`;
      if (!slotsMap.has(slotKey)) {
        slotsMap.set(slotKey, {
          slot_id: row.slot_id,
          slot_date: row.slot_date,
          slot_time: row.slot_time,
          duration_label: row.duration_label,
          variants: []
        });
      }
      
      slotsMap.get(slotKey).variants.push({
        variant_id: row.variant_id,
        variant_name: row.variant_name,
        description: row.variant_description,
        price: parseFloat(row.price),
        capacity: row.capacity,
        available_seats: row.available_seats,
        availability: row.availability
      });
    });

    const result = Array.from(slotsMap.values());

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

