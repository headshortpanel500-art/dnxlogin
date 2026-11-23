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
import { errMsg } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveReseller(req: NextRequest, claimed?: string | null): string | null {
  const session = requireReseller(req);
  if (!session) return null;
  if (claimed && claimed !== session.subject) return null;
  return session.subject;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const reseller = resolveReseller(req, url.searchParams.get('reseller'));
  if (!reseller) return unauthorized();

  try {
    await dbConnect();
    const users = await User.find({ createdBy: reseller }).select('-__v -password').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, durationDays, deviceLimit, reseller: claimed } = body;

    // Auth before dbConnect: a missing MONGODB_URI must not turn an
    // unauthenticated request into a 500 that leaks server state.
    const reseller = resolveReseller(req, claimed);
    if (!reseller) return unauthorized();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    const days = Number(durationDays);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(days) ? days : 30));

    const user = await User.create({
      username,
      password: await hashPassword(password),
      licenseKey: generateLicenseKey(),
      expiresAt,
      deviceLimit: deviceLimit || 0,
      registeredHwids: [],
      createdBy: reseller,
      createdByReseller: reseller,
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to create user') },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, password, durationDays, deviceLimit, reseller: claimed } = body;

    const reseller = resolveReseller(req, claimed);
    if (!reseller) return unauthorized();

    await dbConnect();

    // Ownership check: a reseller may only touch accounts they created.
    const existingUser = await User.findById(id);
    if (!existingUser || existingUser.createdBy !== reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or user not found' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = { username };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    if (durationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(durationDays));
      updateData.expiresAt = expiresAt;
    }

    if (deviceLimit !== undefined) {
      updateData.deviceLimit = deviceLimit;
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to update user') },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, reseller: claimed } = body;

    const reseller = resolveReseller(req, claimed);
    if (!reseller) return unauthorized();

    await dbConnect();

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
