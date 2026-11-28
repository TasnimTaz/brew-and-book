import { NextRequest } from 'next/server';
import { markFailed } from '@/lib/payments';
import { readForm, backToBooking, redirectHome } from '../_shared';

export async function POST(request: NextRequest) {
  const f = await readForm(request);
  if (!f.tran_id) return redirectHome();
  const token = await markFailed(f.tran_id, { event: 'fail', status: f.status }).catch(() => null);
  return backToBooking(token, 'failed');
}

export const GET = redirectHome;
