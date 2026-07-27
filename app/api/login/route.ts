import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { Settings } from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { username, password, hwid, version } = body;

    // 1. Check if server is online
    const serverSettings = await Settings.findOne({ key: 'serverStatus' });
    if (serverSettings && serverSettings.value === 'offline') {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Server is currently offline for maintenance. Please try again later.',
          serverOnline: false 
        },
        { status: 503 }
      );
    }

    // 2. Check version compatibility
    const versionSettings = await Settings.findOne({ key: 'requiredVersion' });
    const requiredVersion = versionSettings ? versionSettings.value : '1.0.0';
    
    // Version check
    if (!version) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Version information is required',
          requiredVersion: requiredVersion
        },
        { status: 400 }
      );
    }

    // Compare versions (simple string comparison, you can use semver for better)
    if (version !== requiredVersion) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Please update to the latest version to continue using the application.',
          requiredVersion: requiredVersion,
          currentVersion: version,
          needsUpdate: true,
          updateUrl: 'https://your-update-url.com' // You can set this in settings
        },
        { status: 400 }
      );
    }

    // 3. Username & Password check
    if (!username || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // 4. HWID check
    if (!hwid) {
      return NextResponse.json(
        { status: 'error', message: 'HWID is required' },
        { status: 400 }
      );
    }

    // 5. Find user
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User not found' },
        { status: 404 }
      );
    }

    // 6. Password check
    if (user.password !== password) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid password' },
        { status: 401 }
      );
    }

    // 7. Expiration check
    const currentDate = new Date();
    const expiryDate = new Date(user.expiresAt);

    if (currentDate > expiryDate) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Subscription expired', 
          expiresAt: user.expiresAt,
          isExpired: true
        },
        { status: 403 }
      );
    }

    // 8. HWID Management - Unlimited Devices
    // Check if this HWID is already registered
    const hwidExists = user.registeredHwids && user.registeredHwids.includes(hwid);

    if (!hwidExists) {
      // This is a new device
      // Since allowMultipleDevices is true by default, we allow unlimited devices
      
      // Add the new HWID to the list
      if (!user.registeredHwids) {
        user.registeredHwids = [];
      }
      user.registeredHwids.push(hwid);
      
      // If no primary HWID set yet, set this as primary
      if (!user.hwid) {
        user.hwid = hwid;
      }
      
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastLoginIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      await user.save();
      
      return NextResponse.json({
        status: 'success',
        message: 'Login successful (New device registered)',
        user: {
          username: user.username,
          expiresAt: user.expiresAt,
          hwid: user.hwid,
          isNewDevice: true,
          deviceCount: user.registeredHwids.length,
        },
        serverInfo: {
          version: requiredVersion,
          serverOnline: true,
        }
      }, { status: 200 });
    }

    // 9. HWID Reset check
    if (user.hwidReset) {
      user.hwidReset = false;
      await user.save();
      
      return NextResponse.json({
        status: 'success',
        message: 'HWID has been reset. Please login again.',
        user: {
          username: user.username,
          expiresAt: user.expiresAt,
          hwidReset: true,
        },
        serverInfo: {
          version: requiredVersion,
          serverOnline: true,
        }
      }, { status: 200 });
    }

    // 10. Successful login with existing HWID
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await user.save();

    return NextResponse.json({
      status: 'success',
      message: 'Login successful',
      user: {
        username: user.username,
        expiresAt: user.expiresAt,
        hwid: user.hwid,
        deviceCount: user.registeredHwids ? user.registeredHwids.length : 1,
      },
      serverInfo: {
        version: requiredVersion,
        serverOnline: true,
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for server status and version check
export async function GET() {
  try {
    await dbConnect();
    
    const [serverStatus, versionSettings] = await Promise.all([
      Settings.findOne({ key: 'serverStatus' }),
      Settings.findOne({ key: 'requiredVersion' })
    ]);

    return NextResponse.json({
      serverOnline: serverStatus ? serverStatus.value !== 'offline' : true,
      requiredVersion: versionSettings ? versionSettings.value : '1.0.0',
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { serverOnline: false, error: 'Failed to fetch server status' },
      { status: 500 }
    );
  }
}