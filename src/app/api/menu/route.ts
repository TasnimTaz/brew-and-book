import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const categories = await pool.query(
      `SELECT id, name, "nameBn", "sortOrder", active
       FROM "MenuCategory"
       ${all ? '' : 'WHERE active = true'}
       ORDER BY "sortOrder" ASC, id ASC`,
    );

    const items = await pool.query(
      `SELECT id, "categoryId", name, "nameBn", description, "priceBdt", "imageUrl", options, tags, available
       FROM "MenuItem"
       ${all ? '' : 'WHERE available = true'}
       ORDER BY "categoryId" ASC, id ASC`,
    );

    return NextResponse.json({ categories: categories.rows, items: items.rows });
  } catch (error) {
    console.error('GET /api/menu failed', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
