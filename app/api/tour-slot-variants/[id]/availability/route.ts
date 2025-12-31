import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET availability for a specific variant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 16 compatibility)
    const resolvedParams = await Promise.resolve(params);
    
    // Extract variant_id from params or URL path
    let variantIdStr = resolvedParams?.id;
    
    if (!variantIdStr) {
      // Fallback: extract from URL path
      const url = new URL(request.url);
      const match = url.pathname.match(/\/tour-slot-variants\/([^/]+)\/availability/);
      if (match && match[1]) {
        variantIdStr = match[1];
      }
    }

    if (!variantIdStr) {
      return NextResponse.json({ error: 'Valid variant ID is required' }, { status: 400 });
    }

    const variant_id = parseInt(variantIdStr);

    if (!variant_id || isNaN(variant_id)) {
      return NextResponse.json({ error: 'Valid variant ID is required' }, { status: 400 });
    }

    const db = await pool.getConnection();

    // Get availability
    const [rows] = await db.execute(
      `SELECT
        v.id AS variant_id,
        v.variant_name,
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
      FROM tour_slot_variants v
      LEFT JOIN bookings b
        ON v.id = b.variant_id
        AND b.status IN ('confirmed', 'completed')
      WHERE v.id = ?
      GROUP BY v.id`,
      [variant_id]
    );

    db.release();

    const result = rows as any[];
    if (Array.isArray(result) && result.length === 0) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const availability = result[0];
    return NextResponse.json({
      variant_id: availability.variant_id,
      variant_name: availability.variant_name,
      capacity: availability.capacity,
      available_seats: availability.available_seats,
      availability: availability.availability
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

