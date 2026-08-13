// app/api/reseller/reset-hwid/route.ts
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

    // Reset HWID
    user.hwid = null;
    user.hwidReset = true;
    user.registeredHwids = [];
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'HWID reset successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to reset HWID' },
      { status: 500 }
    );
  }
}