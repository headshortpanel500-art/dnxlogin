// Signed session tokens for the admin and reseller panels.
//
// The old code set `admin_session=authenticated_true` -- a static string that
// any client could forge with one curl. Tokens here are HMAC-SHA256 over
// `<role>.<subject>.<expiry>`, so the cookie is useless without SESSION_SECRET.

import crypto from 'crypto';

export type Role = 'admin' | 'reseller';

export const ADMIN_COOKIE = 'admin_session';
export const RESELLER_COOKIE = 'reseller_session';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  // SESSION_SECRET is preferred. ADMIN_PASSWORD is accepted as a fallback so an
  // existing deployment keeps working, but rotating the admin password then
  // invalidates every session.
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

function mac(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function issueToken(role: Role, subject: string, ttlMs = DEFAULT_TTL_MS): string {
  if (!secret()) throw new Error('SESSION_SECRET (or ADMIN_PASSWORD) must be set');
  const cleanSubject = subject.trim();
  if (!cleanSubject || cleanSubject.includes('.')) {
    throw new Error('Invalid session subject');
  }
  const exp = Date.now() + ttlMs;
  const payload = `${role}.${cleanSubject}.${exp}`;
  return `${payload}.${mac(payload)}`;
}

export function verifyToken(token: string | undefined | null): { role: Role; subject: string } | null {
  if (!token || !secret()) return null;

  const parts = token.split('.');
  if (parts.length !== 4) return null;

  const [role, subject, expStr, given] = parts;
  if (role !== 'admin' && role !== 'reseller') return null;

  const expected = mac(`${role}.${subject}.${expStr}`);
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, so compare lengths first.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  return { role: role as Role, subject };
}

export function cookieOptions(maxAge = DEFAULT_TTL_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

type CookieCarrier = { cookies: { get(name: string): { value: string } | undefined } };

export function requireAdmin(req: CookieCarrier): { role: Role; subject: string } | null {
  const s = verifyToken(req.cookies.get(ADMIN_COOKIE)?.value);
  return s && s.role === 'admin' ? s : null;
}

export function requireReseller(req: CookieCarrier): { role: Role; subject: string } | null {
  const s = verifyToken(req.cookies.get(RESELLER_COOKIE)?.value);
  return s && s.role === 'reseller' ? s : null;
}

export function unauthorized(what = 'Unauthorized') {
  return Response.json({ success: false, error: what }, { status: 401 });
}
