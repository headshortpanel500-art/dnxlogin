// app/api/files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FileMetadata } from '@/models/User';
import { getGridFSBucket } from '@/lib/gridfs';
import mongoose from 'mongoose';

// সব ফাইলের তালিকা
export async function GET() {
  try {
    await connectDB();

    const files = await FileMetadata.find({})
      .sort({ uploadDate: -1 });

    const formattedFiles = files.map((file: any) => ({
      _id: file._id,
      fileId: file.fileId,
      filename: file.filename,
      contentType: file.contentType,
      size: file.size,
      uploadDate: file.uploadDate,
      downloadCount: file.downloadCount || 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedFiles,
    });

  } catch (error) {
    console.error('Fetch files error:', error);
    return NextResponse.json(
      { success: false, error: 'ফাইল তালিকা লোড করতে সমস্যা' },
      { status: 500 }
    );
  }
}

// ফাইল ডিলিট
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID required' },
        { status: 400 }
      );
    }

    const metadata = await FileMetadata.findOne({ fileId });

    if (!metadata) {
      return NextResponse.json(
        { success: false, error: 'ফাইল পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    const gridFSBucket = getGridFSBucket();
    try {
      await gridFSBucket.delete(new mongoose.Types.ObjectId(fileId));
    } catch (error) {
      console.error('GridFS delete error:', error);
    }

    await FileMetadata.deleteOne({ fileId });

    return NextResponse.json({
      success: true,
      message: 'ফাইল ডিলিট করা হয়েছে',
    });

  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { success: false, error: 'ফাইল ডিলিট করতে সমস্যা' },
      { status: 500 }
    );
  }
}