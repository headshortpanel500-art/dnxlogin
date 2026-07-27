import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const ADMIN_USER = process.env.ADMIN_USERNAME || 'dynamicx';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'dynamicxtopx';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
      });

      // HTTP-Only Cookie সেট করা
      response.cookies.set({
        name: 'admin_session',
        value: 'authenticated_true',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // ১ দিনের জন্য সেশন থাকবে
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}