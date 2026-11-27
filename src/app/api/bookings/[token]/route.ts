import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { maskPhone } from '@/lib/booking/utils';
import { releaseExpiredHolds } from '@/lib/booking/db';
import QRCode from 'qrcode';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await releaseExpiredHolds().catch(() => {});
    const { token } = await params;
    const res = await pool.query(
      `SELECT b.*, t.code AS "tableCode", t.seats, t.zone, s.label AS "slotLabel", s.start AS "slotStart", s."end" AS "slotEnd",
              u.name AS "customerName", u.phone AS "customerPhone"
       FROM "Booking" b
       JOIN "Table" t ON t.id=b."tableId"
       JOIN "TimeSlot" s ON s.id=b."slotId"
       JOIN "User" u ON u.id=b."userId"
       WHERE b.token=$1 LIMIT 1`,
      [token]
    );
    if (!res.rowCount) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    const b = res.rows[0];

    const itemsRes = await pool.query(
      `SELECT oi.quantity, oi."unitPriceBdt", oi.options, mi.name, mi."nameBn"
       FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId" JOIN "MenuItem" mi ON mi.id=oi."menuItemId"
       WHERE o."bookingId"=$1 ORDER BY oi.id ASC`, [b.id]
    );
    const payRes = await pool.query(`SELECT status, method, "amountBdt", gateway FROM "Payment" WHERE "bookingId"=$1 ORDER BY id DESC LIMIT 1`, [b.id]);
    const qrDataUrl = await QRCode.toDataURL(b.qrPayload || b.token, { width: 320, margin: 1 });

    return NextResponse.json({ booking: {
      token: b.token, serial: b.serial, status: b.status, date: b.date, guests: b.guests, note: b.note,
      tableCode: b.tableCode, seats: b.seats, zone: b.zone, slotLabel: b.slotLabel, slotStart: b.slotStart, slotEnd: b.slotEnd,
      customerName: b.customerName, customerPhone: maskPhone(b.customerPhone),
      paymentStatus: payRes.rows[0]?.status || 'UNPAID', paymentMethod: payRes.rows[0]?.method || null,
      totalBdt: payRes.rows[0]?.amountBdt || itemsRes.rows.reduce((s:number,r:{unitPriceBdt:number;quantity:number})=>s + Number(r.unitPriceBdt)*Number(r.quantity),0),
      items: itemsRes.rows, qrDataUrl, holdExpiresAt: b.holdExpiresAt,
    }});
  } catch (e) {
    console.error('GET /api/bookings/[token] failed', e);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}
