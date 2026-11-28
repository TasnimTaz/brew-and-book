import { requireAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const {
      categoryId,
      name,
      nameBn = null,
      description = null,
      priceBdt,
      imageUrl = null,
      options = {},
      tags = [],
      available = true,
    } = body;

    if (!categoryId || !name || priceBdt === undefined) {
      return NextResponse.json({ error: 'Category, name, and priceBdt are required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO "MenuItem" ("categoryId", "name", "nameBn", "description", "priceBdt", "imageUrl", "options", "tags", "available", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [categoryId, name, nameBn, description, priceBdt, imageUrl, JSON.stringify(options), tags, available]
    );

    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/menu/items failed', error);
    const message = error instanceof Error ? error.message : 'Failed to create menu item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
