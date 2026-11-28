import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ADMIN_COOKIE, requireAdmin, verifyAdminSession } from '@/lib/admin-auth';

// Records that a refund was paid back to the customer (do the actual refund in the SSLCommerz merchant panel first).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const paymentId = Number(id);
    if (!Number.isInteger(paymentId)) return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    const note = String(body?.note || '').trim().slice(0, 300);
    const who = verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)?.email || 'admin';

    const res = await pool.query(
      `UPDATE "Payment" SET status='REFUNDED', "updatedAt"=NOW(),
         "rawResponse" = COALESCE("rawResponse"::jsonb, '{}'::jsonb) || $2::jsonb
       WHERE id=$1 AND status='PAID' AND method='ONLINE' RETURNING id`,
      [paymentId, JSON.stringify({ refundNeeded: false, refundedAt: new Date().toISOString(), refundedBy: who, refundNote: note })]
    );
    if (!res.rowCount) return NextResponse.json({ error: 'Only a paid online payment can be marked as refunded' }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/admin/payments/[id]/refund failed', e);
    return NextResponse.json({ error: 'Failed to save the refund' }, { status: 500 });
  }
}
