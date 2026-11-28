import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { releaseExpiredHolds } from '@/lib/booking/db';

// Admin list: bookings of one day, or (filter=refund) every paid online booking that still needs a refund.
const REFUND_SQL = `EXISTS (SELECT 1 FROM "Payment" p WHERE p."bookingId"=b.id AND p.status='PAID' AND p.method='ONLINE'
  AND (b.status='CANCELLED' OR COALESCE(p."rawResponse"::jsonb->>'refundNeeded','')='true'))`;

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await releaseExpiredHolds().catch(() => {});
    const sp = request.nextUrl.searchParams;
    const filter = sp.get('filter') === 'refund' ? 'refund' : 'day';
    const date = String(sp.get('date') || '').slice(0, 10);
    if (filter === 'day' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Valid date is required' }, { status: 400 });

    const where = filter === 'refund' ? REFUND_SQL : `b.date::date = $1::date`;
    const res = await pool.query(
      `SELECT b.id, b.token, b.serial, b.status, to_char(b.date,'YYYY-MM-DD') AS date, b.guests, b.note,
              t.code AS "tableCode", s.label AS "slotLabel", s.start AS "slotStart",
              u.name AS "customerName", u.phone AS "customerPhone",
              COALESCE((SELECT SUM(oi.quantity * oi."unitPriceBdt") FROM "Order" o JOIN "OrderItem" oi ON oi."orderId"=o.id WHERE o."bookingId"=b.id),0)::int AS "orderTotalBdt",
              ${REFUND_SQL} AS "needsRefund",
              COALESCE((SELECT json_agg(json_build_object('id',p.id,'status',p.status,'method',p.method,'gateway',p.gateway,'amountBdt',p."amountBdt",'txn',p."gatewayTxnId",
                        'refundNote',p."rawResponse"::jsonb->>'refundNote') ORDER BY p.id) FROM "Payment" p WHERE p."bookingId"=b.id), '[]'::json) AS payments
       FROM "Booking" b
       JOIN "Table" t ON t.id=b."tableId" JOIN "TimeSlot" s ON s.id=b."slotId" JOIN "User" u ON u.id=b."userId"
       WHERE ${where}
       ORDER BY b.date DESC, s.start ASC, t.code ASC LIMIT 300`,
      filter === 'refund' ? [] : [date]
    );
    return NextResponse.json({ bookings: res.rows });
  } catch (e) {
    console.error('GET /api/admin/bookings failed', e);
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
  }
}
