import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Settings } from '@/models/User';

// GET settings
export async function GET() {
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
export async function POST(req: Request) {
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

    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}