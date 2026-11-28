import { NextRequest, NextResponse } from 'next/server';
import { verifyAndSettle, markFailed } from '@/lib/payments';
import { readForm } from '../_shared';

// Server-to-server notification from SSLCommerz. Needs a public URL (use a tunnel such as ngrok while on localhost).
export async function POST(request: NextRequest) {
  const f = await readForm(request);
  try {
    if (f.tran_id && f.val_id && (f.status === 'VALID' || f.status === 'VALIDATED')) {
      await verifyAndSettle(f.val_id, f.tran_id);
    } else if (f.tran_id) {
      await markFailed(f.tran_id, { event: 'ipn', status: f.status });
    }
    return new NextResponse('OK');
  } catch (e) {
    console.error('SSLCommerz IPN failed', e);
    return new NextResponse('ERROR', { status: 500 });
  }
}
