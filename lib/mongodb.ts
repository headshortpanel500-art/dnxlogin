import mongoose from "mongoose";

// Same lazy-read rule as lib/dbConnect.ts: nothing may throw at import time, or
// `next build` fails during page-data collection on a machine without .env.local.
function uri(): string {
  const value = process.env.MONGODB_URI;
  if (!value) {
    throw new Error("MONGODB_URI is missing");
  }
  return value;
}

type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { __mongooseCache?: ConnectionCache };

const cached: ConnectionCache =
  globalForMongoose.__mongooseCache ?? (globalForMongoose.__mongooseCache = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri());
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
