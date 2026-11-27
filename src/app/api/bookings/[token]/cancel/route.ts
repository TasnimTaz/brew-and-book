import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { normalizeBdPhone } from '@/lib/booking/utils';
import { releaseExpiredHolds } from '@/lib/booking/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await releaseExpiredHolds().catch(() => {});
    const { token } = await params;
    const { phone } = await request.json().catch(() => ({}));
    const normalized = normalizeBdPhone(String(phone || ''));
    if (!normalized) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

    const res = await pool.query(
      `SELECT b.id, b.status, b.date, s.start, u.phone
       FROM "Booking" b JOIN "TimeSlot" s ON s.id=b."slotId" JOIN "User" u ON u.id=b."userId"
       WHERE b.token=$1 LIMIT 1`, [token]
    );
    if (!res.rowCount) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    const b = res.rows[0];
    if (b.phone !== normalized) return NextResponse.json({ error: 'Phone does not match booking' }, { status: 403 });
    if (['CANCELLED','COMPLETED','NO_SHOW'].includes(b.status)) return NextResponse.json({ error: `Booking is already ${b.status.toLowerCase()}` }, { status: 400 });

    const slotStart = new Date(`${new Date(b.date).toISOString().slice(0,10)}T${b.start}:00+06:00`);
    if (slotStart.getTime() - Date.now() < 2 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Cancellation is allowed up to 2 hours before the slot.' }, { status: 400 });
    }

    await pool.query(`UPDATE "Booking" SET status='CANCELLED', "updatedAt"=NOW() WHERE id=$1`, [b.id]);
    return NextResponse.json({ ok: true, status: 'CANCELLED' });
  } catch (e) {
    console.error('POST /api/bookings/[token]/cancel failed', e);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
