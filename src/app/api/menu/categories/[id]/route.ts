import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const catId = parseInt(id, 10);

    const updates: string[] = [];
    const values: unknown[] = [];
    let counter = 1;

    for (const field of ['name', 'nameBn', 'sortOrder', 'active']) {
      if (body[field] !== undefined) {
        updates.push(`"${field}" = $${counter}`);
        values.push(body[field]);
        counter++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 });
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(catId);

    const query = `
      UPDATE "MenuCategory"
      SET ${updates.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category: result.rows[0] });
  } catch (error: unknown) {
    console.error('PATCH /api/menu/categories/[id] failed', error);
    const message = error instanceof Error ? error.message : 'Failed to update category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const catId = parseInt(id, 10);
    const inUse = await pool.query(`SELECT 1 FROM "MenuItem" WHERE "categoryId" = $1 LIMIT 1`, [catId]);
    if ((inUse.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: 'Category has menu items. Move or delete items first.' }, { status: 409 });
    }
    const result = await pool.query(`DELETE FROM "MenuCategory" WHERE id = $1 RETURNING id`, [catId]);
    if (result.rowCount === 0) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/menu/categories/[id] failed', error);
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}