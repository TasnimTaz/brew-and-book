import { NextResponse } from 'next/server';
import { sslEnabled, depositBdt } from '@/lib/sslcommerz';

export async function GET() {
  return NextResponse.json({ online: sslEnabled(), depositBdt: depositBdt() });
}
