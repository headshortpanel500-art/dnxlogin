// app/api/resellers/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Reseller } from '@/models/User';

// GET all resellers
export async function GET() {
  try {
    await dbConnect();
    const resellers = await Reseller.find({}).select('-__v');
    return NextResponse.json({ success: true, data: resellers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resellers' },
      { status: 500 }
    );
  }
}

// POST create reseller
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password } = body;

    // Check if reseller exists
    const existingReseller = await Reseller.findOne({ username });
    if (existingReseller) {
      return NextResponse.json(
        { success: false, error: 'Reseller username already exists' },
        { status: 400 }
      );
    }

    // Create reseller
    const reseller = await Reseller.create({
      username,
      password,
    });

    return NextResponse.json({
      success: true,
      data: reseller,
      message: 'Reseller created successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create reseller' },
      { status: 500 }
    );
  }
}

// DELETE reseller
export async function DELETE(req: Request) {
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete reseller' },
      { status: 500 }
    );
  }
}