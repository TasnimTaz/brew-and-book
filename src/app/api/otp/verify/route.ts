import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { normalizeBdPhone, otpHash, signPayload } from '@/lib/booking/utils';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    const normalized = normalizeBdPhone(String(phone || ''));
    const otp = String(code || '').trim();
    if (!normalized || !/^\d{6}$/.test(otp)) return NextResponse.json({ error: 'Phone and 6-digit OTP are required' }, { status: 400 });

    const res = await pool.query(
      `SELECT id, "codeHash", "expiresAt", attempts, "verifiedAt" FROM "OtpCode" WHERE phone=$1 ORDER BY "createdAt" DESC LIMIT 1`,
      [normalized]
    );
    if (!res.rowCount) return NextResponse.json({ error: 'OTP not found. Request a new code.' }, { status: 400 });
    const row = res.rows[0];
    if (row.verifiedAt) return NextResponse.json({ ok: true, phone: normalized, verification: makeVerification(normalized) });
    if (new Date(row.expiresAt).getTime() < Date.now()) return NextResponse.json({ error: 'OTP expired. Request a new code.' }, { status: 400 });
    if (row.attempts >= 5) return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });

    const expected = otpHash(normalized, otp);
    if (expected !== row.codeHash) {
      await pool.query(`UPDATE "OtpCode" SET attempts=attempts+1 WHERE id=$1`, [row.id]);
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    await pool.query(`UPDATE "OtpCode" SET "verifiedAt"=NOW(), attempts=attempts+1 WHERE id=$1`, [row.id]);
    return NextResponse.json({ ok: true, phone: normalized, verification: makeVerification(normalized) });
  } catch (e) {
    console.error('POST /api/otp/verify failed', e);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}

function makeVerification(phone: string) {
  const exp = Date.now() + 15 * 60_000;
  const payload = `${phone}:${exp}`;
  const sig = signPayload(payload);
  return { phone, exp, sig };
}
