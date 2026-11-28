import { NextRequest, NextResponse } from 'next/server';
import { withTx, releaseExpiredHolds } from '@/lib/booking/db';
import { normalizeBdPhone, verifySignedPayload, bookingToken, signPayload, maskPhone } from '@/lib/booking/utils';
import QRCode from 'qrcode';
import { emitBookingUpdate } from '@/lib/realtime';

export async function POST(request: NextRequest) {
  try {
    await releaseExpiredHolds().catch(() => {});
    const body = await request.json();
    const { tableId, slotId, date, guests, name, phone, note, cart, verification } = body;

    const normalizedPhone = normalizeBdPhone(String(phone || ''));
    if (!tableId || !slotId || !date || !guests || !name || !normalizedPhone) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }
    if (!verification || verification.phone !== normalizedPhone || Number(verification.exp) < Date.now() ||
      !verifySignedPayload(`${verification.phone}:${verification.exp}`, String(verification.sig || ''))) {
      return NextResponse.json({ error: 'Phone verification required. Please verify OTP.' }, { status: 401 });
    }

    const guestsN = Number(guests);
    const tableIdN = Number(tableId);
    const slotIdN = Number(slotId);
    const cleanName = String(name).trim();
    if (!Number.isInteger(guestsN) || guestsN < 1 || guestsN > 20) return NextResponse.json({ error: 'Guests must be a whole number between 1 and 20' }, { status: 400 });
    if (!Number.isInteger(tableIdN) || !Number.isInteger(slotIdN)) return NextResponse.json({ error: 'Invalid table or slot' }, { status: 400 });
    if (cleanName.length < 2) return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });

    const bookingDate = String(date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || Number.isNaN(Date.parse(`${bookingDate}T00:00:00+06:00`))) {
      return NextResponse.json({ error: 'Invalid booking date' }, { status: 400 });
    }
    const todayBd = new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10);
    const maxBd = new Date(Date.now() + 6 * 3600_000 + 60 * 86400_000).toISOString().slice(0, 10);
    if (bookingDate < todayBd) return NextResponse.json({ error: 'You cannot book a past date' }, { status: 400 });
    if (bookingDate > maxBd) return NextResponse.json({ error: 'Bookings open up to 60 days ahead' }, { status: 400 });
    const booking = await withTx(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`${tableIdN}:${bookingDate}:${slotIdN}`]);
      // Second lock (always taken after the first) so two tables booked at the same moment never get the same serial number
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`serial:${bookingDate}`]);
      await client.query(`UPDATE "Booking" SET status='CANCELLED', "updatedAt"=NOW() WHERE status='HELD' AND "holdExpiresAt" <= NOW()`);

      const tableRes = await client.query(`SELECT id, code, seats, active FROM "Table" WHERE id=$1 FOR UPDATE`, [tableIdN]);
      if (!tableRes.rowCount) throw Object.assign(new Error('Table not found'), { status: 404 });
      const table = tableRes.rows[0];
      if (!table.active) throw Object.assign(new Error('Table is not available'), { status: 400 });
      if (guestsN > Number(table.seats)) throw Object.assign(new Error(`This table allows up to ${table.seats} guests`), { status: 400 });

      const slotRes = await client.query(`SELECT id, label, start, "end" FROM "TimeSlot" WHERE id=$1 AND active=true`, [slotIdN]);
      if (!slotRes.rowCount) throw Object.assign(new Error('Invalid time slot'), { status: 400 });
      const slot = slotRes.rows[0];
      if (new Date(`${bookingDate}T${slot.start}:00+06:00`).getTime() <= Date.now()) {
        throw Object.assign(new Error('This time slot has already started. Please choose a later slot.'), { status: 400 });
      }

      const conflict = await client.query(
        `SELECT id, status FROM "Booking" WHERE "tableId"=$1 AND date::date=$2::date AND "slotId"=$3
         AND (status IN ('CONFIRMED','COMPLETED') OR (status='HELD' AND ("holdExpiresAt" IS NULL OR "holdExpiresAt" > NOW())))
         LIMIT 1 FOR UPDATE`,
        [tableIdN, bookingDate, slotIdN]
      );
      if (conflict.rowCount) throw Object.assign(new Error('This table was just booked for the selected slot. Please choose another table.'), { status: 409 });

      const userRes = await client.query(`SELECT id FROM "User" WHERE phone=$1`, [normalizedPhone]);
      let userId: number;
      if (userRes.rowCount) {
        userId = userRes.rows[0].id;
        await client.query(`UPDATE "User" SET name=$1, "updatedAt"=NOW() WHERE id=$2`, [cleanName.slice(0, 120), userId]);
      } else {
        const ins = await client.query(
          `INSERT INTO "User" ("name","phone","role","createdAt","updatedAt") VALUES ($1,$2,'CUSTOMER',NOW(),NOW()) RETURNING id`,
          [cleanName.slice(0, 120), normalizedPhone]
        );
        userId = ins.rows[0].id;
      }

      const activeRes = await client.query(
        `SELECT COUNT(*)::int AS n FROM "Booking" WHERE "userId"=$1 AND status='CONFIRMED' AND date::date >= CURRENT_DATE`, [userId]
      );
      if (activeRes.rows[0].n >= 5) throw Object.assign(new Error('You already have 5 upcoming bookings. Please cancel one first.'), { status: 429 });

      const serialRes = await client.query(
        `SELECT COALESCE(MAX(serial),0)+1 AS serial FROM "Booking" WHERE date::date=$1::date`,
        [bookingDate]
      );
      const serial = Number(serialRes.rows[0].serial);

      const holdExpiresAt = new Date(Date.now() + 10 * 60_000);
      const token = bookingToken(table.code, bookingDate, serial);
      const qrBase = JSON.stringify({ token, table: table.code, date: bookingDate, slotId: Number(slotId), serial });
      const qrPayload = JSON.stringify({ ...JSON.parse(qrBase), sig: signPayload(qrBase) });

      const bRes = await client.query(
        `INSERT INTO "Booking" ("token","serial","tableId","userId","date","slotId","guests","status","note","holdExpiresAt","qrPayload","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5::date,$6,$7,'CONFIRMED',$8,$9,$10,NOW(),NOW()) RETURNING *`,
        [token, serial, tableIdN, userId, bookingDate, slotIdN, guestsN, note ? String(note).slice(0, 500) : null, holdExpiresAt, qrPayload]
      );
      const bookingRow = bRes.rows[0];

      const cartItems = Array.isArray(cart) ? cart : [];
      let totalBdt = 0;
      const validItems: Array<{menuItemId:number;quantity:number;unitPriceBdt:number;options:unknown;name:string;nameBn:string|null}> = [];
      for (const c of cartItems) {
        const menuItemId = Number(c.menuItemId);
        const qty = Math.max(1, Math.min(20, Number(c.quantity || 1)));
        if (!menuItemId) continue;
        const mRes = await client.query(`SELECT id, name, "nameBn", "priceBdt", available FROM "MenuItem" WHERE id=$1`, [menuItemId]);
        if (!mRes.rowCount || !mRes.rows[0].available) continue;
        const mi = mRes.rows[0];
        totalBdt += Number(mi.priceBdt) * qty;
        validItems.push({ menuItemId: mi.id, quantity: qty, unitPriceBdt: Number(mi.priceBdt), options: c.selectedOptions || null, name: mi.name, nameBn: mi.nameBn });
      }

      if (validItems.length > 0) {
        const oRes = await client.query(`INSERT INTO "Order" ("bookingId","totalBdt","createdAt","updatedAt") VALUES ($1,$2,NOW(),NOW()) RETURNING id`, [bookingRow.id, totalBdt]);
        const orderId = oRes.rows[0].id;
        for (const it of validItems) {
          await client.query(
            `INSERT INTO "OrderItem" ("orderId","menuItemId","quantity","unitPriceBdt","options","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
            [orderId, it.menuItemId, it.quantity, it.unitPriceBdt, it.options ? JSON.stringify(it.options) : null]
          );
        }
        await client.query(
          `INSERT INTO "Payment" ("bookingId","gateway","method","amountBdt","status","createdAt","updatedAt") VALUES ($1,'NONE','PAY_AT_SHOP',$2,'UNPAID',NOW(),NOW())`,
          [bookingRow.id, totalBdt]
        );
      }

      return { booking: bookingRow, table, slot, user: { name: cleanName, phone: normalizedPhone }, totalBdt, items: validItems };
    });

    emitBookingUpdate({ type: 'booking.updated', date: String(date).slice(0,10), slotId: Number(slotId), tableId: Number(tableId), status: 'CONFIRMED', bookingId: booking.booking.id, token: booking.booking.token });
    const qrDataUrl = await QRCode.toDataURL(booking.booking.qrPayload || booking.booking.token, { width: 320, margin: 1 });
    return NextResponse.json({
      ok: true,
      booking: {
        ...booking.booking,
        tableCode: booking.table.code,
        slotLabel: booking.slot.label,
        slotStart: booking.slot.start,
        slotEnd: booking.slot.end,
        customerName: booking.user.name,
        customerPhone: maskPhone(booking.user.phone),
        totalBdt: booking.totalBdt,
        items: booking.items,
        qrDataUrl,
      },
    }, { status: 201 });
  } catch (e: unknown) {
    console.error('POST /api/bookings failed', e);
    const err = e as { message?: string; status?: number; code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'This table was just booked for the selected slot. Please choose another table.' }, { status: 409 });
    }
    // Only show messages we threw on purpose; hide raw database errors from customers
    return NextResponse.json({ error: err?.status ? err.message : 'Failed to create booking' }, { status: err?.status || 500 });
  }
}
