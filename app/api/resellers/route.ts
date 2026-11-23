// app/api/resellers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Reseller } from '@/models/User';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { errMsg } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET all resellers -- the password hash is stripped before it leaves the box.
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const resellers = await Reseller.find({}).select('-__v -password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: resellers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resellers' },
      { status: 500 }
    );
  }
}

// POST create reseller
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const existingReseller = await Reseller.findOne({ username });
    if (existingReseller) {
      return NextResponse.json(
        { success: false, error: 'Reseller username already exists' },
        { status: 400 }
      );
    }

    const reseller = await Reseller.create({
      username,
      password: await hashPassword(password),
    });

    return NextResponse.json({
      success: true,
      data: { _id: reseller._id, username: reseller.username, createdAt: reseller.createdAt },
      message: 'Reseller created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to create reseller') },
      { status: 500 }
    );
  }
}

// DELETE reseller
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = body;

    const reseller = await Reseller.findByIdAndDelete(id);

    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'Reseller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reseller deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to delete reseller') },
      { status: 500 }
    );
  }
}
