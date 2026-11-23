import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Settings } from '@/models/User';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { errMsg } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET settings
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();

    const [serverStatus, versionSettings] = await Promise.all([
      Settings.findOne({ key: 'serverStatus' }),
      Settings.findOne({ key: 'requiredVersion' })
    ]);

    return NextResponse.json({
      success: true,
      serverStatus: serverStatus ? serverStatus.value : 'online',
      requiredVersion: versionSettings ? versionSettings.value : '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST update settings
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    // Only the two keys the panel actually reads. An open upsert let the admin
    // page write arbitrary documents into the settings collection.
    if (key !== 'serverStatus' && key !== 'requiredVersion') {
      return NextResponse.json(
        { success: false, error: `Unknown setting: ${key}` },
        { status: 400 }
      );
    }

    if (key === 'serverStatus' && value !== 'online' && value !== 'offline') {
      return NextResponse.json(
        { success: false, error: "serverStatus must be 'online' or 'offline'" },
        { status: 400 }
      );
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      data: setting,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to update settings') },
      { status: 500 }
    );
  }
}
