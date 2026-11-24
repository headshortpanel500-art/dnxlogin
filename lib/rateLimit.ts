// In-memory sliding-window rate limiter and safe string helpers for dashboard auth routes.
// Intentionally NOT applied to /api/login or /api/validate-license/ so live client EXEs
// making direct or burst verification requests are never blocked.

import crypto from 'crypto';
import type { NextRequest } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function checkRateLimit(
  key: string,
  maxAttempts = 10,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Opportunistic cleanup so the map stays bounded in long-lived processes.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets.entries()) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Constant-time string equality to avoid timing side-channels on admin credentials. */
export function safeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Run timingSafeEqual against a dummy buffer of equal length so timing stays uniform.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Reject non-string values (e.g. MongoDB operator objects like { $ne: "" }). */
export function asCleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
