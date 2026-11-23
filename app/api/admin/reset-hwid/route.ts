import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { errMsg } from '@/lib/errors';

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

    user.hwid = null;
    user.hwidReset = true;
    user.registeredHwids = [];
    await user.save();

    return NextResponse.json({
      success: true,
      message: `HWID reset for user: ${username}`,
      data: {
        username: user.username,
        hwidReset: true,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error) },
      { status: 500 }
    );
  }
}
