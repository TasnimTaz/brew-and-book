import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { normalizeBdPhone, otpHash, signPayload } from '@/lib/booking/utils';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    const normalized = normalizeBdPhone(String(phone || ''));
    const otp = String(code || '').trim();
    if (!normalized || !/^\d{6}$/.test(otp)) return NextResponse.json({ error: 'Phone and 6-digit OTP are required' }, { status: 400 });

    // Only the latest UNUSED code counts. A code that was already verified can never mint another verification.
    const res = await pool.query(
      `SELECT id, "codeHash", "expiresAt", attempts FROM "OtpCode"
       WHERE phone=$1 AND "verifiedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1`,
      [normalized]
    );
    if (!res.rowCount) return NextResponse.json({ error: 'OTP not found. Request a new code.' }, { status: 400 });
    const row = res.rows[0];
    if (new Date(row.expiresAt).getTime() < Date.now()) return NextResponse.json({ error: 'OTP expired. Request a new code.' }, { status: 400 });
    if (row.attempts >= 5) return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });

    const a = Buffer.from(otpHash(normalized, otp));
    const b = Buffer.from(String(row.codeHash));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      await pool.query(`UPDATE "OtpCode" SET attempts=attempts+1 WHERE id=$1`, [row.id]);
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Consume the code atomically (single use)
    const used = await pool.query(`UPDATE "OtpCode" SET "verifiedAt"=NOW() WHERE id=$1 AND "verifiedAt" IS NULL RETURNING id`, [row.id]);
    if (!used.rowCount) return NextResponse.json({ error: 'OTP already used. Request a new code.' }, { status: 400 });

    const exp = Date.now() + 15 * 60_000;
    const sig = signPayload(`${normalized}:${exp}`);
    return NextResponse.json({ ok: true, phone: normalized, verification: { phone: normalized, exp, sig } });
  } catch (e) {
    console.error('POST /api/otp/verify failed', e);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
