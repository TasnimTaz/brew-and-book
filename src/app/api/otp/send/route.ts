import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { normalizeBdPhone, otpHash, makeOtpCode, addMinutes } from '@/lib/booking/utils';
import { sendOtpSms } from '@/lib/sms';

const ipHits = new Map<string, { count: number; resetAt: number }>();
function hit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const cur = ipHits.get(key);
  if (!cur || cur.resetAt <= now) { ipHits.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (cur.count >= limit) return false;
  cur.count++; return true;
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    const normalized = normalizeBdPhone(String(phone || ''));
    if (!normalized) return NextResponse.json({ error: 'Valid Bangladesh phone number required' }, { status: 400 });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!hit(`ip:${ip}`, 20, 15 * 60_000) || !hit(`phone:${normalized}`, 5, 15 * 60_000)) {
      return NextResponse.json({ error: 'Too many OTP requests. Please try again later.' }, { status: 429 });
    }

    const recent = await pool.query(
      `SELECT id, "createdAt" FROM "OtpCode" WHERE phone=$1 AND "createdAt" > NOW() - INTERVAL '60 seconds' ORDER BY "createdAt" DESC LIMIT 1`,
      [normalized]
    );
    if (recent.rowCount) return NextResponse.json({ error: 'Please wait before requesting another OTP.' }, { status: 429 });

    const code = makeOtpCode();
    const expiresAt = addMinutes(new Date(), Number(process.env.OTP_EXPIRY_MINUTES || 5));
    const codeHash = otpHash(normalized, code);

    await pool.query(`INSERT INTO "OtpCode" ("phone","codeHash","expiresAt","attempts","createdAt") VALUES ($1,$2,$3,0,NOW())`, [normalized, codeHash, expiresAt]);

    const sms = await sendOtpSms(normalized, code);
    if (!sms.ok) return NextResponse.json({ error: sms.error }, { status: 500 });

    return NextResponse.json({ ok: true, phone: normalized, expiresInMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 5), ...(sms.devCode ? { devCode: sms.devCode } : {}) });
  } catch (e) {
    console.error('POST /api/otp/send failed', e);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
