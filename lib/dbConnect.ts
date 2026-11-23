import mongoose from 'mongoose';

// Read the URI lazily. A top-level `throw` here would fire during `next build`,
// where route modules are imported for static analysis but no database is
// reachable -- the build would fail on a missing .env.local instead of at the
// first request, which is where the error actually matters.
function uri(): string {
  const value = process.env.MONGODB_URI;
  if (!value) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  return value;
}

type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Cached on globalThis so Next's hot reload does not open a new pool per edit.
// The cast is confined to this one line instead of leaking `any` through the file.
const globalForMongoose = globalThis as unknown as { __mongooseCache?: ConnectionCache };

const cached: ConnectionCache =
  globalForMongoose.__mongooseCache ?? (globalForMongoose.__mongooseCache = { conn: null, promise: null });

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri(), opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
