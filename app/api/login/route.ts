import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { username, password, hwid } = body; // hwid যোগ করলাম

    // ১. Username ও Password পাঠানো হয়েছে কি না চেক
    if (!username || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // ২. HWID না পাঠালে error
    if (!hwid) {
      return NextResponse.json(
        { status: 'error', message: 'HWID is required' },
        { status: 400 }
      );
    }

    // ৩. Database-এ ইউজার খোঁজা
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User not found' },
        { status: 404 }
      );
    }

    // ৪. Password মিলছে কি না চেক
    if (user.password !== password) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid password' },
        { status: 401 }
      );
    }

    // ৫. মেয়াদের তারিখ (Expiration Date) চেক
    const currentDate = new Date();
    const expiryDate = new Date(user.expiresAt);

    if (currentDate > expiryDate) {
      return NextResponse.json(
        { status: 'error', message: 'Subscription expired', expiresAt: user.expiresAt },
        { status: 403 }
      );
    }

    // ৬. HWID চেক করুন
    // যদি ইউজারের hwid blank থাকে (প্রথম লগিন)
    if (!user.hwid) {
      // এই HWID টি সংরক্ষণ করুন
      user.hwid = hwid;
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
      
      return NextResponse.json({
        status: 'success',
        message: 'Login successful (HWID registered)',
        user: {
          username: user.username,
          expiresAt: user.expiresAt,
          hwid: user.hwid,
          isFirstLogin: true,
        },
      }, { status: 200 });
    }

    // ৭. HWID ম্যাচিং চেক
    if (user.hwid !== hwid) {
      return NextResponse.json({
        status: 'error',
        message: 'HWID mismatch! This license is already registered to another device.',
        hwidRegistered: true,
        registeredHwid: user.hwid,
      }, { status: 403 });
    }

    // ৮. HWID মিলেছে এবং HWID রিসেট রিকুয়েস্ট আছে?
    if (user.hwidReset) {
      // HWID রিসেট ফ্লাগ ক্লিয়ার করি
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
      }, { status: 200 });
    }

    // ৯. সব সঠিক থাকলে Success Response
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
      },
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}