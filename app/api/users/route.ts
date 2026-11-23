import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { generateLicenseKey } from '@/lib/keys';
import { errMsg, isDuplicateKey } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET all users
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const users = await User.find({}).select('-__v').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create user
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password, durationDays, deviceLimit, licenseKey } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

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
      licenseKey: (licenseKey && String(licenseKey).trim()) || generateLicenseKey(),
      expiresAt,
      deviceLimit: deviceLimit || 0, // 0 = unlimited
      registeredHwids: [],
      createdBy: 'admin',
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    // A duplicate licenseKey surfaces as E11000; report it as what it is.
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

// PUT update user
export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const body = await req.json();
    const { id, username, password, durationDays, deviceLimit, licenseKey } = body;

    const updateData: Record<string, unknown> = { username };

    // An empty password field from the edit form means "leave it alone". A
    // filled one is re-hashed; storing it verbatim would undo the migration.
    if (password) {
      updateData.password = await hashPassword(password);
    }

    if (licenseKey !== undefined) {
      updateData.licenseKey = String(licenseKey).trim() || null;
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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

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

// DELETE user
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = body;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

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
