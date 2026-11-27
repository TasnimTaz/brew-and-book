import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, code, seats, zone, x, y, shape, width, height, "photoUrl", active, "createdAt", "updatedAt"
       FROM "Table"
       WHERE active = true
       ORDER BY code ASC`,
    );
    return NextResponse.json({ tables: result.rows });
  } catch (error) {
    console.error('GET /api/tables failed', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}
