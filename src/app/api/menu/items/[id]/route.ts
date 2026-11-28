import { requireAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const itemId = parseInt(id, 10);

    const updates: string[] = [];
    const values: unknown[] = [];
    let counter = 1;

    const fields = ['categoryId', 'name', 'nameBn', 'description', 'priceBdt', 'imageUrl', 'options', 'tags', 'available'];

    for (const field of fields) {
      if (body[field] !== undefined) {
        if (field === 'options') {
          updates.push(`"${field}" = $${counter}::jsonb`);
          values.push(JSON.stringify(body[field]));
        } else {
          updates.push(`"${field}" = $${counter}`);
          values.push(body[field]);
        }
        counter++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 });
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(itemId);

    const query = `
      UPDATE "MenuItem"
      SET ${updates.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ item: result.rows[0] });
  } catch (error: unknown) {
    console.error('PATCH /api/menu/items/[id] failed', error);
    const message = error instanceof Error ? error.message : 'Failed to update menu item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    // Hard delete or toggle availability
    const result = await pool.query(
      `DELETE FROM "MenuItem" WHERE id = $1 RETURNING *`,
      [itemId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Menu item deleted', item: result.rows[0] });
  } catch (error: unknown) {
    console.error('DELETE /api/menu/items/[id] failed', error);
    const message = error instanceof Error ? error.message : 'Failed to delete menu item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
