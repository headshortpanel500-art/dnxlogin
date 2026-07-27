// lib/auth.ts
import { Session } from '@/models/Session';
import dbConnect from './dbConnect';
import crypto from 'crypto';

export function generateToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export async function createSession(
  userId: string, 
  userType: 'admin' | 'reseller', 
  username: string
): Promise<string> {
  await dbConnect();
  
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await Session.create({
    token,
    userId,
    userType,
    username,
    expiresAt,
  });

  return token;
}

export async function verifySession(token: string): Promise<{
  valid: boolean;
  userId?: string;
  userType?: string;
  username?: string;
}> {
  if (!token) {
    return { valid: false };
  }

  await dbConnect();
  
  const session = await Session.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return { valid: false };
  }

  return {
    valid: true,
    userId: session.userId,
    userType: session.userType,
    username: session.username,
  };
}

export async function deleteSession(token: string): Promise<void> {
  await dbConnect();
  await Session.deleteOne({ token });
}

export async function getSession(token: string) {
  await dbConnect();
  return Session.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
}