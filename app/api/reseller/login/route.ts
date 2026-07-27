// app/api/reseller/login/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Reseller from '@/models/Reseller';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const reseller = await Reseller.findOne({ username });
    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!reseller.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, reseller.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await Reseller.findByIdAndUpdate(reseller._id, { lastLogin: new Date() });

    const token = await createSession(reseller._id.toString(), 'reseller', username);

    const resellerObj = reseller.toObject();
    delete resellerObj.password;

    return NextResponse.json({
      success: true,
      token,
      reseller: resellerObj,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}