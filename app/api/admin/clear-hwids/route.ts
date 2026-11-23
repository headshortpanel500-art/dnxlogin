import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAdmin, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Clear every registered device, including the primary HWID. hwidReset goes
    // back to false so the client is not told "reset pending" forever.
    user.registeredHwids = [];
    user.hwid = null;
    user.hwidReset = false;
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
