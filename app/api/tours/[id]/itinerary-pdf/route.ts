import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { uploadToS3 } from '@/lib/s3';

export const runtime = 'nodejs';

function buildItineraryPdfKey(tourId: string, originalName: string) {
  const ext = (originalName.split('.').pop() || '').toLowerCase();
  const safeExt = ext === 'pdf' ? 'pdf' : 'pdf';
  return `tours/${tourId}/itinerary/${randomUUID()}.${safeExt}`;
}

// POST /api/tours/[id]/itinerary-pdf
// multipart/form-data: file=<PDF>
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const tourId = resolvedParams?.id;

    if (!tourId) {
      return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    const db = await pool.getConnection();
    try {
      // Ensure tour exists before uploading
      const [rows] = await db.execute('SELECT id FROM tours WHERE id = ?', [tourId]);
      const resultRows = rows as Array<{ id: string }>;

      if (!Array.isArray(resultRows) || resultRows.length === 0) {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to S3
      const key = buildItineraryPdfKey(tourId, file.name);
      const url = await uploadToS3(buffer, key, file.type);

      // Store S3 URL in DB
      await db.execute('UPDATE tours SET itinerary_pdf_url = ? WHERE id = ?', [url, tourId]);

      return NextResponse.json(
        {
          success: true,
          tourId,
          url,
          key,
          fileName: file.name,
          size: file.size,
          type: file.type,
        },
        { status: 200 }
      );
    } finally {
      db.release();
    }
  } catch (error: unknown) {
    console.error('Itinerary PDF upload error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to upload itinerary PDF';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({
    message: 'Tour itinerary PDF upload endpoint is ready',
    maxFileSize: '10MB',
    allowedTypes: ['application/pdf'],
    formField: 'file',
  });
}

