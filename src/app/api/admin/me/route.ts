import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('brew_admin_token')?.value;

  if (token === 'authenticated_admin_session') {
    return NextResponse.json({ authenticated: true, email: process.env.ADMIN_EMAIL || 'admin@brewbook.local' });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
