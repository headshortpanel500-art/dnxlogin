import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Settings } from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    
    // Get required version
    const versionSetting = await Settings.findOne({ key: 'exe_version' });
    const serverStatus = await Settings.findOne({ key: 'server_status' });
    
    const requiredVersion = versionSetting?.value || '1.0.0';
    const isServerOnline = serverStatus?.value !== 'offline';
    
    return NextResponse.json({
      success: true,
      data: {
        requiredVersion,
        serverOnline: isServerOnline,
        message: isServerOnline ? 'Server is online' : 'Server is currently offline for maintenance',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      data: {
        requiredVersion: '1.0.0',
        serverOnline: false,
        message: 'Server error'
      }
    }, { status: 500 });
  }
}