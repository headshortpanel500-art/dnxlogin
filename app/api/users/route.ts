import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// GET all users
export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({}).select('-__v');
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create user
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password, durationDays, deviceLimit } = body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    // Create user with device limit
    const user = await User.create({
      username,
      password,
      expiresAt,
      deviceLimit: deviceLimit || 0, // 0 = unlimited
      registeredHwids: [],
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, username, password, durationDays, deviceLimit } = body;

    const updateData: any = { username };
    
    if (password) {
      updateData.password = password;
    }
    
    if (durationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(req: Request) {
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}