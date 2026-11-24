import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, cookieOptions, issueToken } from '@/lib/auth';
import { errMsg } from '@/lib/errors';
import { asCleanString, checkRateLimit, getClientIp, resetRateLimit, safeStringEqual } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateKey = `admin-login:${ip}`;
    const limit = checkRateLimit(rateKey, 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many login attempts. Try again in ${limit.retryAfterSec}s.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const username = asCleanString(body?.username);
    const password = typeof body?.password === 'string' ? body.password : null;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    const ADMIN_USER = process.env.ADMIN_USERNAME || 'dynamicx';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'dynamicxtopx';

    const userMatch = safeStringEqual(username, ADMIN_USER);
    const passMatch = safeStringEqual(password, ADMIN_PASS);

    if (userMatch && passMatch) {
      // Checked after the credential match so a wrong password does not reveal
      // whether the deployment is misconfigured.
      if (!process.env.SESSION_SECRET && !process.env.ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, error: 'Server misconfigured: SESSION_SECRET is not set' },
          { status: 500 }
        );
      }

      resetRateLimit(rateKey);

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
