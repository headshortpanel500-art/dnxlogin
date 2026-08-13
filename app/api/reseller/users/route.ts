// app/api/reseller/users/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const resellerUsername = url.searchParams.get('reseller');

    if (!resellerUsername) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await User.find({ 
      createdBy: resellerUsername 
    }).select('-__v');

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password, durationDays, deviceLimit, reseller } = body;

    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Create user with reseller info
    const user = await User.create({
      username,
      password,
      expiresAt,
      deviceLimit: deviceLimit || 0,
      registeredHwids: [],
      createdBy: reseller,
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

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, username, password, durationDays, deviceLimit, reseller } = body;

    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user belongs to this reseller
    const existingUser = await User.findById(id);
    if (!existingUser || existingUser.createdBy !== reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or user not found' },
        { status: 403 }
      );
    }

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

export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, reseller } = body;

    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user belongs to this reseller
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}