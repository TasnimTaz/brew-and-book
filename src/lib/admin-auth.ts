import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'brew_admin_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const PLACEHOLDER = 'change-me-in-production';
function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.TOKEN_SECRET || process.env.OTP_SECRET;
  if (s && s !== PLACEHOLDER) return s;
  // Dev only: a fixed fallback so local setup works. Never allowed in production.
  return process.env.NODE_ENV === 'production' ? null : 'dev-only-admin-secret';
}

const sign = (payload: string, key: string) => crypto.createHmac('sha256', key).update(payload).digest('base64url');

export function createAdminSession(email: string): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + MAX_AGE_MS })).toString('base64url');
  return `${payload}.${sign(payload, key)}`;
}

export function verifyAdminSession(token: string | undefined): { email: string } | null {
  const key = secret();
  if (!token || !key) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload, key);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return { email: String(data.email) };
  } catch {
    return null;
  }
}

/** Returns a 401 response when the caller is not a logged-in admin, otherwise null. */
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}
