import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { normalizeBdPhone } from '@/lib/booking/utils';
import { releaseExpiredHolds } from '@/lib/booking/db';
import { startOnlinePayment } from '@/lib/payments';
import { sslEnabled } from '@/lib/sslcommerz';

// Retry a payment for a booking that is still being held (e.g. the first attempt failed or was cancelled).
export async function POST(request: NextRequest) {
  try {
    if (!sslEnabled()) return NextResponse.json({ error: 'Online payment is not available right now' }, { status: 400 });
    await releaseExpiredHolds().catch(() => {});
    const { token, phone } = await request.json();
    const normalized = normalizeBdPhone(String(phone || ''));
    if (!token || !normalized) return NextResponse.json({ error: 'Booking token and phone number are required' }, { status: 400 });

    const res = await pool.query(
      `SELECT b.id, b.status, u.phone, u.name FROM "Booking" b JOIN "User" u ON u.id=b."userId" WHERE b.token=$1 LIMIT 1`, [String(token)]
    );
    if (!res.rowCount) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    const b = res.rows[0];
    if (b.phone !== normalized) return NextResponse.json({ error: 'Phone does not match this booking' }, { status: 403 });
    if (b.status !== 'HELD') return NextResponse.json({ error: 'This booking is not waiting for payment' }, { status: 400 });

    const pays = await pool.query(`SELECT "amountBdt", status FROM "Payment" WHERE "bookingId"=$1 AND method='ONLINE' ORDER BY id DESC`, [b.id]);
    if (!pays.rowCount) return NextResponse.json({ error: 'No online payment was requested for this booking' }, { status: 400 });
    if (pays.rows.some((p) => p.status === 'PAID')) return NextResponse.json({ error: 'This booking is already paid' }, { status: 400 });
    if (pays.rowCount >= 4) return NextResponse.json({ error: 'Too many payment attempts. Please book again.' }, { status: 429 });

    await pool.query(`UPDATE "Booking" SET "holdExpiresAt"=GREATEST("holdExpiresAt", NOW() + INTERVAL '10 minutes'), "updatedAt"=NOW() WHERE id=$1`, [b.id]);
    const paymentUrl = await startOnlinePayment(b.id, Number(pays.rows[0].amountBdt), { name: b.name, phone: normalized });
    return NextResponse.json({ ok: true, paymentUrl });
  } catch (e) {
    console.error('POST /api/payments/sslcommerz/init failed', e);
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 502 });
  }
}
