import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const slotId = searchParams.get('slotId');
    const all = searchParams.get('all') === 'true'; // For admin to see inactive tables

    if (date && slotId) {
      // Query tables joined with bookings for that date & slot
      const query = `
        SELECT 
          t.id, t.code, t.seats, t.zone, t.x, t.y, t.shape, t.width, t.height, t."photoUrl", t.active,
          CASE 
            WHEN t.active = false THEN 'UNAVAILABLE'
            WHEN b.status IN ('CONFIRMED', 'COMPLETED') THEN 'BOOKED'
            WHEN b.status = 'HELD' AND (b."holdExpiresAt" IS NULL OR b."holdExpiresAt" > NOW()) THEN 'HELD'
            ELSE 'AVAILABLE'
          END AS status,
          b.id AS "activeBookingId",
          b.status AS "bookingStatus"
        FROM "Table" t
        LEFT JOIN "Booking" b 
          ON b."tableId" = t.id 
          AND b.date::date = $1::date 
          AND b."slotId" = $2::int
          AND b.status IN ('HELD', 'CONFIRMED', 'COMPLETED')
        ${all ? '' : 'WHERE t.active = true'}
        ORDER BY t.code ASC
      `;
      const result = await pool.query(query, [date, slotId]);
      return NextResponse.json({ tables: result.rows });
    }

    // Default: return all tables with general availability
    const result = await pool.query(
      `SELECT id, code, seats, zone, x, y, shape, width, height, "photoUrl", active,
              CASE WHEN active = true THEN 'AVAILABLE' ELSE 'UNAVAILABLE' END as status
       FROM "Table"
       ${all ? '' : 'WHERE active = true'}
       ORDER BY code ASC`,
    );
    return NextResponse.json({ tables: result.rows });
  } catch (error) {
    console.error('GET /api/tables failed', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, seats, zone, x, y, shape = 'rect', width = 100, height = 80, photoUrl = null } = body;

    const result = await pool.query(
      `INSERT INTO "Table" ("code", "seats", "zone", "x", "y", "shape", "width", "height", "photoUrl", "active", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
       RETURNING *`,
      [code, seats, zone, x, y, shape, width, height, photoUrl]
    );

    return NextResponse.json({ table: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/tables failed', error);
    return NextResponse.json({ error: error.message || 'Failed to create table' }, { status: 500 });
  }
}
