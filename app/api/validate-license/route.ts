// FLC EXTREME license endpoint.
//
// The injected panel (flc_payload.dll) posts {key, hwid} here and expects a very
// specific JSON shape. Anything else -- a non-200 status, a missing field, a
// string where an int belongs -- makes the client show
// "Erro no servidor (codigo: N)" or throw 0xE06D7363.
//
// `sig` is a 64-byte digest the client compares against a value it computes
// itself. We do not have that algorithm, so the hook redirects the check
// (redirects=891A4:88BC4) and the value below is never verified. Keep it
// 64 lowercase hex characters so the length check passes if the redirect is
// ever dropped.

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User, { Settings } from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIG = 'd418ffb24a01162bd4ced1bf1b253f3f5219554cf6c1ac19cd426dd520251cb1';
const PRODUCT = 'FLC EXTREME';
const INVALID = 'Chave de licenca invalida';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Always 200. A 4xx/5xx makes the client print a status code instead of the
// message, and 401 additionally looks like an expired session.
function fail(message = INVALID) {
  return NextResponse.json({ success: false, message }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body: unknown = await req.json().catch(() => ({}));
    const fields = (body ?? {}) as Record<string, unknown>;
    const key = String(fields.key ?? '').trim();
    const hwid = String(fields.hwid ?? '').trim();

    if (!key || !hwid) return fail();

    const status = await Settings.findOne({ key: 'serverStatus' });
    if (status && status.value === 'offline') {
      return fail('Servidor em manutencao. Tente novamente mais tarde.');
    }

    // `key` is a license key, but accounts created before licenseKey existed
    // only have a username, so both are accepted. The key side matches
    // case-insensitively and anchored: a customer pasting one out of a chat
    // client can arrive lowercased, and an unanchored regex would let a short
    // key match a longer one. The username side stays exact.
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
      $or: [{ licenseKey: new RegExp(`^${escaped}$`, 'i') }, { username: key }],
    });
    if (!user) return fail();

    const now = Date.now();
    const expires = new Date(user.expiresAt);
    const expMs = expires.getTime();
    if (!Number.isFinite(expMs) || expMs <= now) return fail('Chave de licenca expirada');

    const hwids: string[] = Array.isArray(user.registeredHwids) ? user.registeredHwids : [];
    if (!hwids.includes(hwid)) {
      const limit = user.deviceLimit || 0;
      if (limit > 0 && hwids.length >= limit) return fail('Limite de dispositivos atingido');
      hwids.push(hwid);
      user.registeredHwids = hwids;
      if (!user.hwid) user.hwid = hwid;
    }

    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginIP =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    await user.save();

    const days = Math.max(0, Math.floor((expMs - now) / 86_400_000));

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      days_remaining: days,
      expiry_date: `${pad(expires.getDate())}/${pad(expires.getMonth() + 1)}/${expires.getFullYear()}`,
      time_remaining_display: `${days} dias`,
      username: user.username,
      product: PRODUCT,
      sig: SIG,
    });
  } catch {
    return fail('Erro no servidor');
  }
}

// Handy for "is my backend reachable" checks. The panel never calls it.
export async function GET() {
  try {
    await dbConnect();
    const status = await Settings.findOne({ key: 'serverStatus' });
    return NextResponse.json({
      online: !status || status.value !== 'offline',
      endpoint: '/api/validate-license/',
    });
  } catch {
    return NextResponse.json({ online: false }, { status: 200 });
  }
}
