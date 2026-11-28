import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { emitBookingUpdate } from '@/lib/realtime';

const ACTIONS: Record<string, { from: string[]; to: string }> = {
  complete: { from: ['CONFIRMED'], to: 'COMPLETED' }, // guest checked in
  no_show: { from: ['CONFIRMED'], to: 'NO_SHOW' },
  cancel: { from: ['CONFIRMED', 'HELD'], to: 'CANCELLED' },
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const bookingId = Number(id);
    const { action } = await request.json();
    const rule = ACTIONS[String(action)];
    if (!Number.isInteger(bookingId) || !rule) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const res = await pool.query(
      `UPDATE "Booking" SET status=$2, "holdExpiresAt"=NULL, "updatedAt"=NOW()
       WHERE id=$1 AND status = ANY($3::"BookingStatus"[])
       RETURNING id, token, "tableId", "slotId", to_char(date,'YYYY-MM-DD') AS dstr`,
      [bookingId, rule.to, rule.from]
    );
    if (!res.rowCount) return NextResponse.json({ error: `This booking cannot be changed (it must be ${rule.from.join(' or ').toLowerCase()})` }, { status: 409 });
    const b = res.rows[0];
    emitBookingUpdate({ type: 'booking.updated', date: b.dstr, slotId: b.slotId, tableId: b.tableId, status: rule.to, bookingId: b.id, token: b.token });
    return NextResponse.json({ ok: true, status: rule.to });
  } catch (e) {
    console.error('PATCH /api/admin/bookings/[id] failed', e);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
