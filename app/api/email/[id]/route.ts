/**
 * Compatibility route.
 *
 * Some clients call `/api/email/:id` while our canonical route is `/api/mail/:id`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailByUid } from '@/lib/mail';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const uid = Number.parseInt(id, 10);

    if (!Number.isFinite(uid) || uid <= 0) {
      return NextResponse.json({ error: 'Invalid email id' }, { status: 400 });
    }

    const email = await getEmailByUid(uid);
    return NextResponse.json({ email });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch email';
    const status = message.toLowerCase().includes('not found') ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

