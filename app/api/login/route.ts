import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { Settings } from '@/models/User';
import { hashPassword, verifyPassword } from '@/lib/password';
import { errMsg } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { username, password, hwid, version, key } = body;

    // 1. Check if server is online
    const serverSettings = await Settings.findOne({ key: 'serverStatus' });
    if (serverSettings && serverSettings.value === 'offline') {
      return NextResponse.json(
        {
          status: 'error',
          success: false,
          message: 'Server is currently offline for maintenance. Please try again later.',
          serverOnline: false
        },
        { status: 503 }
      );
    }

    // 2. Check version compatibility
    const versionSettings = await Settings.findOne({ key: 'requiredVersion' });
    const requiredVersion = versionSettings ? versionSettings.value : '1.0.0';

    if (!version) {
      return NextResponse.json(
        {
          status: 'error',
          success: false,
          message: 'Version information is required',
          requiredVersion: requiredVersion
        },
        { status: 400 }
      );
    }

    if (version !== requiredVersion) {
      return NextResponse.json(
        {
          status: 'error',
          success: false,
          message: 'Please update to the latest version to continue using the application.',
          requiredVersion: requiredVersion,
          currentVersion: version,
          needsUpdate: true,
        },
        { status: 400 }
      );
    }

    // 3. Credentials present
    if ((!username && !key) || !password) {
      return NextResponse.json(
        { status: 'error', success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // 4. HWID check
    if (!hwid) {
      return NextResponse.json(
        { status: 'error', success: false, message: 'HWID is required' },
        { status: 400 }
      );
    }

    // 5. Find user -- by license key if one was sent, otherwise by username.
    const user = key
      ? await User.findOne({ licenseKey: String(key).trim() })
      : await User.findOne({ username });

    // 6. Password check.
    //
    // "User not found" and "Invalid password" used to be different messages with
    // different status codes, which let anyone enumerate valid usernames. One
    // answer for both now.
    const check = await verifyPassword(password, user?.password);
    if (!user || !check.ok) {
      return NextResponse.json(
        { status: 'error', success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Upgrade a legacy plaintext password on the first successful login.
    if (check.legacy) {
      user.password = await hashPassword(password);
    }

    // 7. Expiration check
    const currentDate = new Date();
    const expiryDate = new Date(user.expiresAt);

    if (currentDate > expiryDate) {
      return NextResponse.json(
        {
          status: 'error',
          success: false,
          message: 'Subscription expired',
          expiresAt: user.expiresAt,
          isExpired: true
        },
        { status: 403 }
      );
    }

    // 8. HWID management with device limit
    const registered: string[] = Array.isArray(user.registeredHwids) ? user.registeredHwids : [];
    const isHwidRegistered = registered.includes(hwid);
    const currentDeviceCount = registered.length;
    const deviceLimit = user.deviceLimit || 0; // 0 = unlimited
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Existing device -- allow login
    if (isHwidRegistered) {
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastLoginIP = ip;
      await user.save();

      return NextResponse.json({
        status: 'success',
        success: true,
        message: 'Login successful',
        user: {
          username: user.username,
          expiresAt: user.expiresAt,
          hwid: user.hwid,
          deviceCount: currentDeviceCount,
          deviceLimit: deviceLimit === 0 ? 'Unlimited' : deviceLimit,
        },
        serverInfo: {
          version: requiredVersion,
          serverOnline: true,
        }
      }, { status: 200 });
    }

    // New device -- check device limit
    if (deviceLimit > 0 && currentDeviceCount >= deviceLimit) {
      return NextResponse.json({
        status: 'error',
        success: false,
        message: `Device limit reached! This license allows maximum ${deviceLimit} device(s).`,
        deviceLimit: deviceLimit,
        currentDevices: currentDeviceCount,
        deviceLimitReached: true,
      }, { status: 403 });
    }

    // Register new device
    registered.push(hwid);
    user.registeredHwids = registered;

    if (!user.hwid) {
      user.hwid = hwid;
    }

    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginIP = ip;
    await user.save();

    const remainingSlots = deviceLimit === 0 ? 'Unlimited' : (deviceLimit - registered.length);

    return NextResponse.json({
      status: 'success',
      success: true,
      message: 'New device registered successfully!',
      user: {
        username: user.username,
        expiresAt: user.expiresAt,
        hwid: user.hwid,
        deviceCount: registered.length,
        deviceLimit: deviceLimit === 0 ? 'Unlimited' : deviceLimit,
        remainingSlots: remainingSlots,
        isNewDevice: true,
      },
      serverInfo: {
        version: requiredVersion,
        serverOnline: true,
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { status: 'error', success: false, message: errMsg(error, 'Internal server error') },
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
