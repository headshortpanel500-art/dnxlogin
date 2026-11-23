// lib/gridfs.ts
import mongoose from 'mongoose';

type Bucket = mongoose.mongo.GridFSBucket;

const globalForGridfs = globalThis as unknown as { __gridfsBucket?: Bucket };

export function getGridFSBucket(): Bucket {
  if (globalForGridfs.__gridfsBucket) {
    return globalForGridfs.__gridfsBucket;
  }

  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
    chunkSizeBytes: 1024 * 1024, // 1MB per chunk
  });

  globalForGridfs.__gridfsBucket = bucket;

  return bucket;
}
