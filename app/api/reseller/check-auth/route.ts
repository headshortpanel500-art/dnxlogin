// app/api/reseller/check-auth/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint is not needed anymore since we use localStorage
  // But keeping it for compatibility
  return NextResponse.json({ authenticated: false });
}