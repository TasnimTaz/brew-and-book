import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const session = verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (session) return NextResponse.json({ authenticated: true, email: session.email });
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
