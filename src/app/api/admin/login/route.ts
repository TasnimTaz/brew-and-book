import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, createAdminSession, safeEqual } from '@/lib/admin-auth';

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const cur = attempts.get(ip);
    if (cur && cur.resetAt > now && cur.count >= 10) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    attempts.set(ip, cur && cur.resetAt > now ? { ...cur, count: cur.count + 1 } : { count: 1, resetAt: now + 15 * 60_000 });

    const { email, password } = await request.json();

    const isProd = process.env.NODE_ENV === 'production';
    const expectedEmail = process.env.ADMIN_EMAIL || (isProd ? '' : 'admin@brewbook.local');
    const expectedPassword = process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin123');
    if (!expectedEmail || !expectedPassword) {
      return NextResponse.json({ error: 'Admin login is not configured on the server' }, { status: 500 });
    }
    if (isProd && expectedPassword === 'change-me-in-production') {
      return NextResponse.json({ error: 'Admin login is not configured on the server' }, { status: 500 });
    }

    const ok = safeEqual(String(email || ''), expectedEmail) && safeEqual(String(password || ''), expectedPassword);
    if (!ok) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const session = createAdminSession(expectedEmail);
    if (!session) return NextResponse.json({ error: 'Server secret is not configured' }, { status: 500 });

    attempts.delete(ip);
    const response = NextResponse.json({ success: true, email: expectedEmail });
    response.cookies.set(ADMIN_COOKIE, session, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
