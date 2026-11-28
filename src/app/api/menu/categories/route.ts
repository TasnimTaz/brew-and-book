import { requireAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { name, nameBn = null, sortOrder = 0, active = true } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO "MenuCategory" ("name", "nameBn", "sortOrder", "active", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [name, nameBn, sortOrder, active]
    );

    return NextResponse.json({ category: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/menu/categories failed', error);
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
