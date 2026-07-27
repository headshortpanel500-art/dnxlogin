// app/api/admin/login/route.ts
import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// এই হ্যাশটা ব্যবহার করুন অথবা নতুন করে তৈরি করুন
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.Zx5hHrFvZgYyjZ.yU5lJWZYsJDa';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { username, password } = body;

    console.log('Login attempt for:', username);

    if (username === ADMIN_USERNAME) {
      const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      console.log('Password valid:', isValid);
      
      if (isValid) {
        const token = await createSession('admin', 'admin', username);
        console.log('Token created:', token.substring(0, 20) + '...');
        
        return NextResponse.json({
          success: true,
          token,
          user: { username, role: 'admin' },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}