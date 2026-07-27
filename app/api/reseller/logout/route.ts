// app/api/reseller/logout/route.ts
import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (token) {
      await deleteSession(token);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}