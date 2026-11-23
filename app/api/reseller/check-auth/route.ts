// app/api/reseller/check-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireReseller } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireReseller(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json(
    { authenticated: true, username: session.subject },
    { status: 200 }
  );
}
