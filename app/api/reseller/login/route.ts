// app/api/reseller/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Reseller } from '@/models/User';
import { cookieOptions, issueToken, RESELLER_COOKIE } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const reseller = await Reseller.findOne({ username });

    // One message and one status for "no such reseller" and "wrong password",
    // otherwise the endpoint tells an attacker which usernames exist.
    const check = await verifyPassword(password, reseller?.password);
    if (!reseller || !check.ok) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Upgrade a legacy plaintext password on first successful login.
    if (check.legacy) {
      reseller.password = await hashPassword(password);
      await reseller.save();
    }

    const response = NextResponse.json({
      success: true,
      reseller: { username: reseller.username },
    });

    // The dashboard kept the reseller name in localStorage and sent it in the
    // body of every call. That is not authentication -- anyone could post
    // `reseller: "someone-else"`. The cookie is what the routes now trust.
    response.cookies.set({
      name: RESELLER_COOKIE,
      value: issueToken('reseller', reseller.username),
      ...cookieOptions(),
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
