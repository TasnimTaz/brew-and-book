import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, start, "end", label, active
       FROM "TimeSlot"
       WHERE active = true
       ORDER BY start ASC`,
    );
    return NextResponse.json({ slots: result.rows });
  } catch (error) {
    console.error('GET /api/slots failed', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}
