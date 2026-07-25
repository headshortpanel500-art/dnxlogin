import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// ১. সব ইউজার লিস্ট পাওয়ার জন্য (GET)
export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ২. নতুন ইউজার তৈরি করার জন্য (POST)
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password, durationDays } = body;

    // মেয়াদের তারিখ হিসেব করা
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(durationDays));

    const user = await User.create({
      username,
      password,
      expiresAt,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// ৩. ইউজার এডিট করার জন্য (PUT)
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, username, password, durationDays } = body;

    const updateData: any = { username };
    if (password) updateData.password = password;
    if (durationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(durationDays));
      updateData.expiresAt = expiresAt;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// ৪. ইউজার ডিলিট করার জন্য (DELETE)
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const { id } = await req.json();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}