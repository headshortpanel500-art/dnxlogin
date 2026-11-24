// app/api/reseller/users/route.ts
//
// Authentication comes from the reseller_session cookie. The `reseller` query
// param and body field are still accepted because the dashboard sends them, but
// they are only cross-checked against the cookie -- never trusted on their own.
// Before this change any client could read or edit another reseller's users by
// putting a different name in the URL.

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import { requireReseller, unauthorized } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { generateLicenseKey } from '@/lib/keys';
import { errMsg, isDuplicateKey } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveReseller(req: NextRequest, claimed?: string | null): string | null {
  const session = requireReseller(req);
  if (!session) return null;
  if (claimed && claimed !== session.subject) return null;
  return session.subject;
}

function parseDeviceLimit(value: unknown, fallback = 1): number | null {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0 || num > 10000) {
    return null;
  }
  return num;
}

function sanitizeUser(doc: { toObject: () => Record<string, unknown> }) {
  const obj = doc.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const reseller = resolveReseller(req, url.searchParams.get('reseller'));
  if (!reseller) return unauthorized();

  try {
    await dbConnect();
    const users = await User.find({ createdBy: reseller }).select('-__v -password').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: users });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, durationDays, deviceLimit, licenseKey, reseller: claimed } = body;

    // Auth before dbConnect: a missing MONGODB_URI must not turn an
    // unauthenticated request into a 500 that leaks server state.
    const reseller = resolveReseller(req, claimed);
    if (!reseller) return unauthorized();

    const cleanUsername = String(username ?? '').trim();
    if (!cleanUsername || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const parsedLimit = parseDeviceLimit(deviceLimit, 1);
    if (parsedLimit === null) {
      return NextResponse.json(
        { success: false, error: 'Device limit must be 0 (unlimited) or a positive whole number' },
        { status: 400 }
      );
    }

    const days = Number(durationDays);
    if (durationDays !== undefined && (!Number.isFinite(days) || days < 1 || days > 36500)) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 1 and 36500 days' },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(days) ? Math.floor(days) : 30));

    const cleanKey = licenseKey && String(licenseKey).trim()
      ? String(licenseKey).trim().toUpperCase()
      : generateLicenseKey();

    const user = await User.create({
      username: cleanUsername,
      password: await hashPassword(password),
      licenseKey: cleanKey,
      expiresAt,
      deviceLimit: parsedLimit,
      registeredHwids: [],
      createdBy: reseller,
      createdByReseller: reseller,
    });

    return NextResponse.json({
      success: true,
      data: sanitizeUser(user),
      message: 'User created successfully',
    });
  } catch (error) {
    if (isDuplicateKey(error)) {
      return NextResponse.json(
        { success: false, error: 'Username or license key already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to create user') },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      username,
      password,
      durationDays,
      extendDays,
      deviceLimit,
      addDevices,
      licenseKey,
      rotateKey,
      reseller: claimed,
    } = body;

    const reseller = resolveReseller(req, claimed);
    if (!reseller) return unauthorized();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Ownership check: a reseller may only touch accounts they created.
    const existingUser = await User.findById(id);
    if (!existingUser || existingUser.createdBy !== reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or user not found' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (username !== undefined && String(username).trim()) {
      updateData.username = String(username).trim();
    }

    if (password) {
      updateData.password = await hashPassword(password);
    }

    if (rotateKey) {
      updateData.licenseKey = generateLicenseKey();
    } else if (licenseKey !== undefined) {
      const trimmedKey = String(licenseKey).trim().toUpperCase();
      updateData.licenseKey = trimmedKey || null;
    }

    if (extendDays !== undefined && Number(extendDays) > 0) {
      const addMs = Math.floor(Number(extendDays)) * 86_400_000;
      const baseTime = Math.max(Date.now(), new Date(existingUser.expiresAt).getTime());
      updateData.expiresAt = new Date(baseTime + addMs);
    } else if (durationDays !== undefined && durationDays !== null && durationDays !== '') {
      const days = Number(durationDays);
      if (!Number.isFinite(days) || days < 1 || days > 36500) {
        return NextResponse.json(
          { success: false, error: 'Duration must be between 1 and 36500 days' },
          { status: 400 }
        );
      }
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Math.floor(days));
      updateData.expiresAt = expiresAt;
    }

    if (addDevices !== undefined && Number(addDevices) !== 0) {
      const currentLimit = Number(existingUser.deviceLimit ?? 1);
      if (currentLimit === 0) {
        updateData.deviceLimit = 0;
      } else {
        const nextLimit = Math.max(1, Math.min(10000, currentLimit + Math.floor(Number(addDevices))));
        updateData.deviceLimit = nextLimit;
      }
    } else if (deviceLimit !== undefined) {
      const parsedLimit = parseDeviceLimit(deviceLimit, 1);
      if (parsedLimit === null) {
        return NextResponse.json(
          { success: false, error: 'Device limit must be 0 (unlimited) or a positive whole number' },
          { status: 400 }
        );
      }
      updateData.deviceLimit = parsedLimit;
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-__v -password');

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    if (isDuplicateKey(error)) {
      return NextResponse.json(
        { success: false, error: 'Username or license key already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to update user') },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids, reseller: claimed } = body;

    const reseller = resolveReseller(req, claimed);
    if (!reseller) return unauthorized();

    await dbConnect();

    if (Array.isArray(ids) && ids.length > 0) {
      const result = await User.deleteMany({ _id: { $in: ids }, createdBy: reseller });
      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} user(s) deleted successfully`,
      });
    }

    const existingUser = await User.findById(id);
    if (!existingUser || existingUser.createdBy !== reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or user not found' },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to delete user') },
      { status: 500 }
    );
  }
}
