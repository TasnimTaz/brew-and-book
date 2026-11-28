import { NextRequest } from 'next/server';
import { verifyAndSettle, tokenForTran } from '@/lib/payments';
import { readForm, backToBooking, redirectHome } from '../_shared';

export async function POST(request: NextRequest) {
  const f = await readForm(request);
  if (!f.tran_id) return redirectHome();
  try {
    if (!f.val_id) return backToBooking(await tokenForTran(f.tran_id), 'failed');
    const out = await verifyAndSettle(f.val_id, f.tran_id);
    return backToBooking(out.token, out.state === 'PAID' || out.state === 'ALREADY_PAID' ? 'success' : 'failed');
  } catch (e) {
    console.error('SSLCommerz success handler failed', e);
    return backToBooking(await tokenForTran(f.tran_id).catch(() => null), 'pending');
  }
}

export const GET = redirectHome;
