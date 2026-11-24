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
    const users = await User.find({}).select('-__v -password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch {
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
    const { username, password, durationDays, deviceLimit, licenseKey, createdBy } = body;

    const cleanUsername = String(username ?? '').trim();
    if (!cleanUsername || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    const days = Number(durationDays);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(days) && days > 0 ? Math.floor(days) : 30));

    const parsedLimit = Number(deviceLimit);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit >= 0 ? Math.floor(parsedLimit) : 0;

    const owner = createdBy && String(createdBy).trim() ? String(createdBy).trim() : 'admin';

    const user = await User.create({
      username: cleanUsername,
      password: await hashPassword(password),
      licenseKey: (licenseKey && String(licenseKey).trim().toUpperCase()) || generateLicenseKey(),
      expiresAt,
      deviceLimit: safeLimit, // 0 = unlimited
      registeredHwids: [],
      createdBy: owner,
      createdByReseller: owner !== 'admin' ? owner : null,
    });

    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.__v;

    return NextResponse.json({
      success: true,
      data: sanitized,
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
    const {
      id,
      username,
      password,
      durationDays,
      extendDays,
      deviceLimit,
      licenseKey,
      rotateKey,
      createdBy,
    } = body;

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (username !== undefined && String(username).trim()) {
      updateData.username = String(username).trim();
    }

    // An empty password field from the edit form means "leave it alone". A
    // filled one is re-hashed; storing it verbatim would undo the migration.
    if (password) {
      updateData.password = await hashPassword(password);
    }

    if (rotateKey) {
      updateData.licenseKey = generateLicenseKey();
    } else if (licenseKey !== undefined) {
      updateData.licenseKey = String(licenseKey).trim().toUpperCase() || null;
    }

    if (extendDays !== undefined && Number(extendDays) > 0) {
      const addMs = Math.floor(Number(extendDays)) * 86_400_000;
      const baseTime = Math.max(Date.now(), new Date(existingUser.expiresAt).getTime());
      updateData.expiresAt = new Date(baseTime + addMs);
    } else if (durationDays !== undefined && durationDays !== null && durationDays !== '') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Math.max(1, Math.floor(Number(durationDays))));
      updateData.expiresAt = expiresAt;
    }

    if (deviceLimit !== undefined) {
      const parsedLimit = Number(deviceLimit);
      updateData.deviceLimit = Number.isFinite(parsedLimit) && parsedLimit >= 0 ? Math.floor(parsedLimit) : 0;
    }

    if (createdBy !== undefined && String(createdBy).trim()) {
      const owner = String(createdBy).trim();
      updateData.createdBy = owner;
      updateData.createdByReseller = owner !== 'admin' ? owner : null;
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

// DELETE user
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const body = await req.json();
    const { id, ids } = body;

    if (Array.isArray(ids) && ids.length > 0) {
      const result = await User.deleteMany({ _id: { $in: ids } });
      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} user(s) deleted successfully`,
      });
    }

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
