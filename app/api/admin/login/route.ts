import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, cookieOptions, issueToken } from '@/lib/auth';
import { errMsg } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const ADMIN_USER = process.env.ADMIN_USERNAME || 'dynamicx';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'dynamicxtopx';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      // Checked after the credential match so a wrong password does not reveal
      // whether the deployment is misconfigured.
      if (!process.env.SESSION_SECRET && !process.env.ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, error: 'Server misconfigured: SESSION_SECRET is not set' },
          { status: 500 }
        );
      }

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
      });

      // Signed token, not a static "authenticated_true" string. The old value
      // could be typed into devtools by anyone and the whole admin API opened.
      response.cookies.set({
        name: ADMIN_COOKIE,
        value: issueToken('admin', username),
        ...cookieOptions(),
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Login failed') },
      { status: 500 }
    );
  }
}
