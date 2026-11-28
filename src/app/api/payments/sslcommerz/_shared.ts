import { NextRequest, NextResponse } from 'next/server';
import { appUrl } from '@/lib/sslcommerz';

export async function readForm(request: NextRequest): Promise<Record<string, string>> {
  try {
    const fd = await request.formData();
    const out: Record<string, string> = {};
    fd.forEach((v, k) => { if (typeof v === 'string') out[k] = v; });
    return out;
  } catch {
    return {};
  }
}

export function backToBooking(token: string | null, payment: string) {
  const path = token ? `/booking/${encodeURIComponent(token)}?payment=${payment}` : '/';
  return NextResponse.redirect(`${appUrl()}${path}`, 303);
}

export const redirectHome = () => NextResponse.redirect(`${appUrl()}/`, 303);
