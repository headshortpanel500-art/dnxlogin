// app/api/admin/resellers/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Reseller from '@/models/Reseller';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session.valid || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const resellers = await Reseller.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    const resellersWithStats = await Promise.all(
      resellers.map(async (reseller) => {
        const userCount = await User.countDocuments({ 
          createdBy: reseller.username 
        });
        
        const activeUsers = await User.countDocuments({
          createdBy: reseller.username,
          expiresAt: { $gt: new Date() }
        });

        const devicesResult = await User.aggregate([
          { $match: { createdBy: reseller.username } },
          { $project: { 
              deviceCount: { $size: { $ifNull: ['$registeredHwids', []] } }
            }
          },
          { $group: {
              _id: null,
              total: { $sum: '$deviceCount' }
            }
          }
        ]);

        return {
          ...reseller.toObject(),
          totalUsersCreated: userCount,
          activeUsersCount: activeUsers,
          totalDevices: devicesResult.length > 0 ? devicesResult[0].total : 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: resellersWithStats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session.valid || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, password, email, maxUsers, level } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingReseller = await Reseller.findOne({ username });
    if (existingReseller) {
      return NextResponse.json(
        { success: false, error: 'Reseller already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const reseller = await Reseller.create({
      username,
      password: hashedPassword,
      email: email || '',
      maxUsers: maxUsers || 0,
      level: level || 1,
    });

    const resellerObj = reseller.toObject();
    delete resellerObj.password;

    return NextResponse.json({
      success: true,
      data: resellerObj,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session.valid || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, username, password, email, maxUsers, level, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Reseller ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (maxUsers !== undefined) updateData.maxUsers = maxUsers;
    if (level !== undefined) updateData.level = level;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const reseller = await Reseller.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');

    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Reseller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reseller,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session.valid || session.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Reseller ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const reseller = await Reseller.findById(id);
    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Reseller not found' },
        { status: 404 }
      );
    }

    await User.deleteMany({ createdBy: reseller.username });
    await Reseller.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Reseller and all associated users deleted',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}