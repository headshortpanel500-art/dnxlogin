// app/api/reseller/check-auth/route.ts
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Reseller from '@/models/Reseller';

export async function GET(request: Request) {
  try {
    const headers = request.headers;
    const authHeader = headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const session = await verifySession(token);
    
    if (session.valid && session.userType === 'reseller') {
      await dbConnect();
      const reseller = await Reseller.findOne({ 
        username: session.username 
      }).select('-password');
      
      if (reseller && reseller.isActive) {
        return NextResponse.json({
          authenticated: true,
          reseller,
        });
      }
    }

    return NextResponse.json({ authenticated: false });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}