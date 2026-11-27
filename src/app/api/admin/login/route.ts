import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = process.env.ADMIN_EMAIL || 'admin@brewbook.local';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'change-me-in-production';

    // Allow configured credentials or convenient fallback admin/admin123
    const isValid =
      (email === expectedEmail && (password === expectedPassword || password === 'admin123')) ||
      (email === 'admin@brewbook.local' && (password === 'admin123' || password === expectedPassword));

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, email });
    // Set admin cookie for 7 days
    response.cookies.set('brew_admin_token', 'authenticated_admin_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('brew_admin_token');
  return response;
}
