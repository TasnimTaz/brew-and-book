import { NextResponse } from 'next/server';
import { releaseExpiredHolds } from '@/lib/booking/db';

export async function POST() {
  try {
    const rows = await releaseExpiredHolds();
    return NextResponse.json({ ok: true, released: rows.length, rows });
  } catch (e) {
    console.error('release-holds failed', e);
    return NextResponse.json({ error: 'Failed to release holds' }, { status: 500 });
  }
}

export const GET = POST;
