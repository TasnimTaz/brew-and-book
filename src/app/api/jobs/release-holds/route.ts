import { NextRequest, NextResponse } from 'next/server';
import { releaseExpiredHolds } from '@/lib/booking/db';
import { verifyAdminSession, ADMIN_COOKIE, safeEqual } from '@/lib/admin-auth';

function allowed(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (secret && bearer && safeEqual(bearer, secret)) return true;
  return !!verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(request: NextRequest) {
  if (!allowed(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const rows = await releaseExpiredHolds();
    return NextResponse.json({ ok: true, released: rows.length });
  } catch (e) {
    console.error('release-holds failed', e);
    return NextResponse.json({ error: 'Failed to release holds' }, { status: 500 });
  }
}

// Schedulers such as Vercel Cron call GET with the CRON_SECRET bearer token.
export const GET = POST;
