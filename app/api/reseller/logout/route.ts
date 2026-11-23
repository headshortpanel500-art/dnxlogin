// app/api/reseller/logout/route.ts
import { NextResponse } from 'next/server';
import { RESELLER_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: RESELLER_COOKIE,
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
