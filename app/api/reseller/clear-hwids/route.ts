// app/api/reseller/clear-hwids/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, reseller } = body;

    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user and verify it belongs to this reseller
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.createdBy !== reseller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - User does not belong to you' },
        { status: 403 }
      );
    }

    // Clear all registered HWIDs
    user.registeredHwids = [];
    user.hwid = null;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'All devices cleared successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear devices' },
      { status: 500 }
    );
  }
}