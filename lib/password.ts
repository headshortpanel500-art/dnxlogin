// Password hashing and verification.
//
// Existing accounts were created with `user.password !== password` against a
// plaintext column, so the database still holds cleartext for everyone who
// signed up before this file existed. `verifyPassword` accepts both shapes and
// reports whether the stored value was legacy, so a caller can upgrade it in
// place on the next successful login. No forced password reset.

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export type VerifyResult = { ok: boolean; legacy: boolean };

export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<VerifyResult> {
  if (!stored) return { ok: false, legacy: false };

  // bcrypt hashes are $2a$ / $2b$ / $2y$ followed by the cost.
  if (/^\$2[aby]\$/.test(stored)) {
    return { ok: await bcrypt.compare(plain, stored), legacy: false };
  }

  return { ok: constantTimeEqual(plain, stored), legacy: true };
}

// Same rules for the reseller collection.
export const hash = hashPassword;
