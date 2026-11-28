import { pool } from '@/lib/db';
import { withTx } from '@/lib/booking/db';
import { createSession, validatePayment } from '@/lib/sslcommerz';
import { emitBookingUpdate } from '@/lib/realtime';

/** Creates a PENDING payment row and an SSLCommerz session. Returns the hosted payment page URL. */
export async function startOnlinePayment(bookingId: number, amountBdt: number, cust: { name: string; phone: string }): Promise<string> {
  const b = await pool.query(`SELECT token FROM "Booking" WHERE id=$1`, [bookingId]);
  const token = String(b.rows[0].token);
  const tranId = `BB${bookingId}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const ins = await pool.query(
    `INSERT INTO "Payment" ("bookingId","gateway","method","amountBdt","status","gatewayTxnId","createdAt","updatedAt")
     VALUES ($1,'SSLCOMMERZ','ONLINE',$2,'PENDING',$3,NOW(),NOW()) RETURNING id`,
    [bookingId, amountBdt, tranId]
  );
  try {
    return await createSession({ tranId, amountBdt, name: cust.name, phone: cust.phone, token });
  } catch (e) {
    await pool.query(`UPDATE "Payment" SET status='FAILED', "rawResponse"=$2, "updatedAt"=NOW() WHERE id=$1`, [ins.rows[0].id, JSON.stringify({ error: String(e) })]);
    throw e;
  }
}

export type Outcome = { state: 'PAID' | 'ALREADY_PAID' | 'FAILED' | 'NOT_FOUND'; token: string | null; refundNeeded?: boolean };

/** Marks a payment PAID and confirms the booking. Safe to call many times (IPN + success redirect). */
export async function settlePaid(tranId: string, raw: unknown): Promise<Outcome> {
  const r = await withTx(async (c) => {
    const p = await c.query(
      `SELECT p.id, p.status, p."bookingId", b.token, b.status AS bstatus, b."tableId", b."slotId", to_char(b.date,'YYYY-MM-DD') AS dstr
       FROM "Payment" p JOIN "Booking" b ON b.id=p."bookingId" WHERE p."gatewayTxnId"=$1 FOR UPDATE OF p`,
      [tranId]
    );
    if (!p.rowCount) return { state: 'NOT_FOUND' as const, token: null };
    const row = p.rows[0];
    if (row.status === 'PAID') return { state: 'ALREADY_PAID' as const, token: String(row.token) };

    let refundNeeded = false;
    let confirmed = false;
    if (row.bstatus === 'HELD') {
      await c.query(`UPDATE "Booking" SET status='CONFIRMED', "holdExpiresAt"=NULL, "updatedAt"=NOW() WHERE id=$1`, [row.bookingId]);
      confirmed = true;
    } else if (row.bstatus === 'CANCELLED') {
      // The 10 minute hold expired before the money arrived: re-confirm only if nobody else took the table.
      await c.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`${row.tableId}:${row.dstr}:${row.slotId}`]);
      const clash = await c.query(
        `SELECT 1 FROM "Booking" WHERE "tableId"=$1 AND date::date=$2::date AND "slotId"=$3 AND id<>$4
         AND (status IN ('CONFIRMED','COMPLETED') OR (status='HELD' AND ("holdExpiresAt" IS NULL OR "holdExpiresAt" > NOW()))) LIMIT 1`,
        [row.tableId, row.dstr, row.slotId, row.bookingId]
      );
      if (clash.rowCount) refundNeeded = true;
      else {
        await c.query(`UPDATE "Booking" SET status='CONFIRMED', "holdExpiresAt"=NULL, "updatedAt"=NOW() WHERE id=$1`, [row.bookingId]);
        confirmed = true;
      }
    } else {
      confirmed = row.bstatus === 'CONFIRMED';
    }
    await c.query(`UPDATE "Payment" SET status='PAID', "rawResponse"=$2, "updatedAt"=NOW() WHERE id=$1`, [row.id, JSON.stringify({ gateway: raw, refundNeeded })]);
    return { state: 'PAID' as const, token: String(row.token), refundNeeded, confirmed, bookingId: row.bookingId, tableId: row.tableId, slotId: row.slotId, dstr: row.dstr };
  });
  if (r.state === 'PAID' && 'confirmed' in r && r.confirmed) {
    emitBookingUpdate({ type: 'booking.updated', date: r.dstr, slotId: Number(r.slotId), tableId: Number(r.tableId), status: 'CONFIRMED', bookingId: r.bookingId, token: r.token });
  }
  return { state: r.state, token: r.token, refundNeeded: 'refundNeeded' in r ? r.refundNeeded : undefined };
}

/** Failed / cancelled payments only mark the attempt. The table hold expires by itself, so a forged callback cannot cancel a booking. */
export async function markFailed(tranId: string, raw: unknown): Promise<string | null> {
  await pool.query(`UPDATE "Payment" SET status='FAILED', "rawResponse"=$2, "updatedAt"=NOW() WHERE "gatewayTxnId"=$1 AND status='PENDING'`, [tranId, JSON.stringify(raw ?? {})]);
  return tokenForTran(tranId);
}

export async function tokenForTran(tranId: string): Promise<string | null> {
  const r = await pool.query(`SELECT b.token FROM "Payment" p JOIN "Booking" b ON b.id=p."bookingId" WHERE p."gatewayTxnId"=$1`, [tranId]);
  return r.rowCount ? String(r.rows[0].token) : null;
}

/** Never trust the browser or IPN fields: ask SSLCommerz, then check transaction id, currency and amount. */
export async function verifyAndSettle(valId: string, tranId: string): Promise<Outcome> {
  const pay = await pool.query(`SELECT "amountBdt" FROM "Payment" WHERE "gatewayTxnId"=$1`, [tranId]);
  if (!pay.rowCount) return { state: 'NOT_FOUND', token: null };
  const v = await validatePayment(valId);
  const okStatus = v.status === 'VALID' || v.status === 'VALIDATED';
  const okTran = v.tran_id === tranId;
  const okCurrency = String(v.currency_type || '').toUpperCase() === 'BDT';
  const okAmount = Math.abs(Number(v.amount) - Number(pay.rows[0].amountBdt)) < 0.01;
  if (!okStatus || !okTran || !okCurrency || !okAmount) {
    console.warn('SSLCommerz validation rejected', { tranId, status: v.status, okTran, okCurrency, okAmount });
    return { state: 'FAILED', token: await markFailed(tranId, v) };
  }
  return settlePaid(tranId, v);
}
