// lib/gridfs.ts
import mongoose from 'mongoose';

let cachedGridFS: any = (global as any).gridfs || null;

export function getGridFSBucket() {
  if (cachedGridFS) {
    return cachedGridFS;
  }

  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
    chunkSizeBytes: 1024 * 1024, // 1MB per chunk
  });

  cachedGridFS = bucket;
  (global as any).gridfs = bucket;

  return bucket;
}