// app/api/download/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FileMetadata } from '@/models/User';
import { getGridFSBucket } from '@/lib/gridfs';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    await connectDB();

    const { fileId } = params;

    if (!fileId) {
      return new NextResponse('Invalid file ID', { status: 400 });
    }

    // মেটাডেটা খোঁজা
    const metadata = await FileMetadata.findOne({ fileId });

    if (!metadata) {
      return new NextResponse('ফাইল পাওয়া যায়নি', { status: 404 });
    }

    // ডাউনলোড কাউন্ট বাড়ানো
    metadata.downloadCount = (metadata.downloadCount || 0) + 1;
    await metadata.save();

    // GridFS থেকে ফাইল স্ট্রিম করা
    const gridFSBucket = getGridFSBucket();
    
    // ফাইল আছে কিনা চেক
    const files = await gridFSBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    
    if (files.length === 0) {
      return new NextResponse('ফাইল পাওয়া যায়নি', { status: 404 });
    }

    const downloadStream = gridFSBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    // হেডার সেট করা
    const headers = new Headers();
    headers.set('Content-Type', metadata.contentType || 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(metadata.filename)}"`
    );
    headers.set('Content-Length', metadata.size.toString());

    // স্ট্রিমকে রেসপন্সে পাঠানো
    const readableStream = new ReadableStream({
      start(controller) {
        downloadStream.on('data', (chunk: any) => {
          controller.enqueue(chunk);
        });
        downloadStream.on('end', () => {
          controller.close();
        });
        downloadStream.on('error', (error: any) => {
          console.error('Stream error:', error);
          controller.error(error);
        });
      },
      cancel() {
        downloadStream.destroy();
      },
    });

    return new NextResponse(readableStream, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return new NextResponse(
      error.message || 'ডাউনলোড করতে সমস্যা হয়েছে', 
      { status: 500 }
    );
  }
}