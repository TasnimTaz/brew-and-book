import { PoolClient } from 'pg';
import { pool } from '@/lib/db';

export async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function releaseExpiredHolds() {
  const res = await pool.query(
    `UPDATE "Booking" SET status='CANCELLED', "updatedAt"=NOW()
     WHERE status='HELD' AND "holdExpiresAt" IS NOT NULL AND "holdExpiresAt" <= NOW()
     RETURNING id, token, "tableId", date, "slotId"`
  );
  return res.rows;
}
