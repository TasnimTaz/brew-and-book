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
    const tableId = parseInt(id, 10);

    const updates: string[] = [];
    const values: unknown[] = [];
    let counter = 1;

    const fields = ['code', 'seats', 'zone', 'x', 'y', 'shape', 'width', 'height', 'photoUrl', 'active'];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`"${field}" = $${counter}`);
        values.push(body[field]);
        counter++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(tableId);

    const query = `
      UPDATE "Table"
      SET ${updates.join(', ')}
      WHERE id = $${counter}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json({ table: result.rows[0] });
  } catch (error: unknown) {
    console.error('PATCH /api/tables/[id] failed', error);
    const message = error instanceof Error ? error.message : 'Failed to update table';
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
    const tableId = parseInt(id, 10);

    const result = await pool.query(
      `UPDATE "Table" SET active = false, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [tableId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Table deactivated', table: result.rows[0] });
  } catch (error: unknown) {
    console.error('DELETE /api/tables/[id] failed', error);
    const message = error instanceof Error ? error.message : 'Failed to delete table';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
