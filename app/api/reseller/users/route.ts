// app/api/reseller/users/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import Reseller from '@/models/Reseller';
import { verifySession } from '@/lib/auth';

async function getResellerFromToken(token: string) {
  if (!token) return null;
  
  const session = await verifySession(token);
  if (!session.valid || session.userType !== 'reseller') {
    return null;
  }
  
  await dbConnect();
  const reseller = await Reseller.findOne({ username: session.username });
  if (!reseller || !reseller.isActive) {
    return null;
  }
  
  return reseller;
}

// GET - Reseller এর সব ইউজার দেখাবে
export async function GET(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    const reseller = await getResellerFromToken(token);
    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await User.find({ 
      createdBy: reseller.username 
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - নতুন ইউজার তৈরি করবে
export async function POST(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    const reseller = await getResellerFromToken(token);
    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // চেক করা রিসেলার সর্বোচ্চ ইউজার লিমিট পেরিয়েছে কিনা
    if (reseller.maxUsers > 0) {
      const currentUsers = await User.countDocuments({ 
        createdBy: reseller.username 
      });
      if (currentUsers >= reseller.maxUsers) {
        return NextResponse.json(
          { success: false, error: 'You have reached your maximum user limit' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { username, password, durationDays, deviceLimit } = body;

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

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));

    const user = await User.create({
      username,
      password,
      expiresAt,
      deviceLimit: deviceLimit || 0,
      createdBy: reseller.username,
      createdByReseller: reseller.username,
    });

    // রিসেলারের স্ট্যাট আপডেট করা
    const totalUsers = await User.countDocuments({ createdBy: reseller.username });
    const activeUsers = await User.countDocuments({
      createdBy: reseller.username,
      expiresAt: { $gt: new Date() }
    });
    
    await Reseller.findByIdAndUpdate(reseller._id, {
      totalUsersCreated: totalUsers,
      activeUsersCount: activeUsers,
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - ইউজার আপডেট করবে
export async function PUT(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    const reseller = await getResellerFromToken(token);
    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, username, password, durationDays, deviceLimit } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // চেক করা এই ইউজার এই রিসেলারের কিনা
    const existingUser = await User.findOne({ 
      _id: id, 
      createdBy: reseller.username 
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found or not owned by you' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (durationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      updateData.expiresAt = expiresAt;
    }
    if (deviceLimit !== undefined) updateData.deviceLimit = deviceLimit;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - ইউজার ডিলিট করবে
export async function DELETE(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    const reseller = await getResellerFromToken(token);
    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // চেক করা এই ইউজার এই রিসেলারের কিনা
    const user = await User.findOne({ 
      _id: id, 
      createdBy: reseller.username 
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found or not owned by you' },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(id);

    // রিসেলারের স্ট্যাট আপডেট করা
    const totalUsers = await User.countDocuments({ createdBy: reseller.username });
    const activeUsers = await User.countDocuments({
      createdBy: reseller.username,
      expiresAt: { $gt: new Date() }
    });
    
    await Reseller.findByIdAndUpdate(reseller._id, {
      totalUsersCreated: totalUsers,
      activeUsersCount: activeUsers,
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}