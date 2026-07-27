// app/api/admin/check-auth/route.ts
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    console.log('Checking auth with token:', token ? 'Token exists' : 'No token');

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const session = await verifySession(token);
    console.log('Session verification result:', session);

    if (session.valid && session.userType === 'admin') {
      return NextResponse.json({
        authenticated: true,
        user: { username: session.username, role: 'admin' },
      });
    }

    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Check auth error:', error);
    return NextResponse.json({ authenticated: false });
  }
}