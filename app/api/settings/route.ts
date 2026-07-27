import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Settings } from '@/models/User';

// Get all settings
export async function GET() {
  try {
    await dbConnect();
    const settings = await Settings.find({});
    const settingsObj: any = {};
    settings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });
    return NextResponse.json({ success: true, data: settingsObj });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update or create settings
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}