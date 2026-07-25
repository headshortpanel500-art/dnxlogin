import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();

    // EXE ফাইল থেকে পাঠানো JSON Data পড়া
    const body = await req.json();
    const { username, password } = body;

    // ১. Username ও Password পাঠানো হয়েছে কি না চেক
    if (!username || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // ২. Database-এ ইউজার খোঁজা
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User not found' },
        { status: 404 }
      );
    }

    // ৩. Password মিলছে কি না চেক
    if (user.password !== password) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid password' },
        { status: 401 }
      );
    }

    // ৪. মেয়াদের তারিখ (Expiration Date) চেক
    const currentDate = new Date();
    const expiryDate = new Date(user.expiresAt);

    if (currentDate > expiryDate) {
      return NextResponse.json(
        { status: 'error', message: 'Subscription expired', expiresAt: user.expiresAt },
        { status: 403 }
      );
    }

    // ৫. সব সঠিক থাকলে Success Response পাঠানো
    return NextResponse.json(
      {
        status: 'success',
        message: 'Login successful',
        user: {
          username: user.username,
          expiresAt: user.expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}