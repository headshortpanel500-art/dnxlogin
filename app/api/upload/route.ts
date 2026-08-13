// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FileMetadata } from '@/models/User';
import { getGridFSBucket } from '@/lib/gridfs';
import mongoose from 'mongoose';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const replaceFileId = formData.get('replaceFileId') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'কোন ফাইল সিলেক্ট করা হয়নি' },
        { status: 400 }
      );
    }

    if (files.length > 3) {
      return NextResponse.json(
        { success: false, error: 'সর্বোচ্চ ৩টি ফাইল আপলোড করা যাবে' },
        { status: 400 }
      );
    }

    const gridFSBucket = getGridFSBucket();
    const uploadedFileIds = [];

    // যদি replaceFileId থাকে
    if (replaceFileId) {
      const oldMetadata = await FileMetadata.findOne({ fileId: replaceFileId });
      
      if (oldMetadata) {
        try {
          await gridFSBucket.delete(new mongoose.Types.ObjectId(replaceFileId));
        } catch (error) {
          console.error('Failed to delete old file:', error);
        }
        await FileMetadata.deleteOne({ fileId: replaceFileId });
      }
    }

    // প্রতিটি ফাইল আপলোড
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // ৫০MB লিমিট
      if (buffer.length > 50 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `${file.name} ৫০MB এর বেশি!` },
          { status: 400 }
        );
      }

      const uploadStream = gridFSBucket.openUploadStream(file.name, {
        contentType: file.type || 'application/octet-stream',
        metadata: {
          originalName: file.name,
          uploadedAt: new Date(),
        },
      });

      const fileId = uploadStream.id;

      const readableStream = Readable.from(buffer);
      
      await new Promise((resolve, reject) => {
        readableStream
          .pipe(uploadStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      const metadata = new FileMetadata({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        size: buffer.length,
        fileId: fileId.toString(),
        uploadedBy: 'admin',
      });

      await metadata.save();
      uploadedFileIds.push({
        fileId: fileId.toString(),
        filename: file.name,
      });
    }

    return NextResponse.json({
      success: true,
      message: replaceFileId ? 'ফাইল আপডেট সফল!' : 'ফাইল আপলোড সফল!',
      fileIds: uploadedFileIds,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'আপলোড ব্যর্থ' },
      { status: 500 }
    );
  }
}