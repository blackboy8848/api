/**
 * Compatibility route.
 *
 * Some clients call `/api/email/inbox` while our canonical route is `/api/mail/inbox`.
 * This file keeps backward compatibility by serving the same IMAP inbox response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInbox } from '@/lib/mail';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : 50;

    const emails = await getInbox(limit);
    return NextResponse.json({ emails });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch inbox';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

