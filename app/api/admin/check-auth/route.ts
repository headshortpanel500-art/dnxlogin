// The admin page calls this on mount to decide whether to show the dashboard.
// The route did not exist before, so the panel always rendered the login form
// even with a valid cookie.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json(
    { authenticated: true, username: session.subject },
    { status: 200 }
  );
}
