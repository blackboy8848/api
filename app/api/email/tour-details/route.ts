import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { addCorsHeaders } from '@/lib/cors';
import { sendTourDetailsEmail, TourForEmail } from '@/lib/email';

interface ApiTour {
  id?: string;
  banner?: string;
  imageUrl?: string;
  title?: string;
  subdescription?: string;
  description?: string;
  duration?: string;
  price?: number;
  location?: string;
  difficulty?: string;
  maxGroupSize?: number;
  category?: string;
  subCategory?: string;
  [key: string]: unknown;
}

function parseTourJsonFields(tour: Record<string, unknown>): Record<string, unknown> {
  const parsed = { ...tour };
  const jsonFields = ['images', 'startDates', 'included', 'notIncluded', 'schedule'];
  jsonFields.forEach((field) => {
    const val = parsed[field];
    if (val && typeof val === 'string') {
      try {
        parsed[field] = JSON.parse(val as string);
      } catch {
        parsed[field] = null;
      }
    }
  });
  return parsed;
}

function mapTourToForEmail(t: ApiTour): TourForEmail {
  return {
    title: t.title,
    subdescription: t.subdescription,
    description: t.description,
    duration: t.duration,
    price: t.price,
    location: t.location,
    difficulty: t.difficulty,
    maxGroupSize: t.maxGroupSize,
    imageUrl: t.imageUrl,
    category: t.category,
    subCategory: t.subCategory,
    bannerImageUrl: t.banner || t.imageUrl || undefined,
  };
}

/** Parse request body reliably: string → JSON.parse, object → use as-is */
async function parseBody(request: NextRequest): Promise<{ tourIds?: string[] }> {
  try {
    const raw = await request.text();
    if (!raw || !raw.trim()) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const tourIds = (parsed as { tourIds?: unknown }).tourIds;
      return {
        tourIds: Array.isArray(tourIds) ? tourIds.filter((id): id is string => typeof id === 'string') : undefined,
      };
    }
    return {};
  } catch {
    return {};
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

/**
 * POST /api/email/tour-details
 * Sends tour details to all users via email.
 * Body: { "tourIds": ["id1", "id2"] } to send only selected tours; omit or empty = all tours.
 * Optional query: ?activeOnly=true to send only active tours (when not filtering by tourIds).
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      const response = NextResponse.json(
        {
          error:
            'Email service not configured. Set SMTP_USER and SMTP_PASSWORD in environment.',
        },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const body = await parseBody(request);
    const tourIds = body.tourIds;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const db = await pool.getConnection();

    const [userRows] = await db.execute(
      'SELECT email, display_name FROM users WHERE email IS NOT NULL AND email != ""'
    );
    const users = userRows as Array<{ email: string; display_name?: string | null }>;

    let tourQuery = 'SELECT * FROM tours';
    const tourParams: unknown[] = [];
    if (activeOnly) {
      tourQuery += ' WHERE isActive = ?';
      tourParams.push(1);
    }
    tourQuery += ' ORDER BY created_at DESC';

    const [tourRows] = await db.execute(tourQuery, tourParams);
    db.release();

    const rawTours = tourRows as ApiTour[];
    let tours = rawTours.map((t) => parseTourJsonFields(t) as ApiTour);

    if (tourIds && tourIds.length > 0) {
      const idSet = new Set(tourIds);
      tours = tours.filter((t) => idSet.has(t.id as string));
    }

    if (users.length === 0) {
      const response = NextResponse.json(
        { success: true, message: 'No users with email found', sent: 0, failed: 0 },
        { status: 200 }
      );
      return addCorsHeaders(response, origin);
    }

    if (tours.length === 0) {
      const response = NextResponse.json(
        { success: false, error: 'No tours found to send', sent: 0, failed: 0 },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    const toursForEmail: TourForEmail[] = tours.map(mapTourToForEmail);

    let sent = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const user of users) {
      const email = user.email?.trim();
      if (!email) continue;
      try {
        await sendTourDetailsEmail(email, user.display_name ?? null, toursForEmail);
        sent++;
      } catch (err: unknown) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ email, error: message });
      }
    }

    const response = NextResponse.json(
      {
        success: failed === 0,
        message: `Tour details sent to ${sent} user(s)${failed > 0 ? `; ${failed} failed` : ''}.`,
        sent,
        failed,
        totalUsers: users.length,
        tourCount: toursForEmail.length,
        ...(errors.length > 0 && { errors }),
      },
      { status: 200 }
    );
    return addCorsHeaders(response, origin);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const response = NextResponse.json({ error: message }, { status: 500 });
    return addCorsHeaders(response, origin);
  }
}
