// app/api/reseller/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ success: true });
}