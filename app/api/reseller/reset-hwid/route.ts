// app/api/reseller/reset-hwid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import { requireReseller, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = requireReseller(req);
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { username, reseller: claimed } = body;

    if (claimed && claimed !== session.subject) return unauthorized();

    await dbConnect();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.createdBy !== session.subject) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - User does not belong to you' },
        { status: 403 }
      );
    }

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
