// app/api/download/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FileMetadata } from '@/models/User';
import { getGridFSBucket } from '@/lib/gridfs';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const { slug } = params;

    if (!slug) {
      return new NextResponse('Invalid file', { status: 400 });
    }

    // ✅ স্লাগ দিয়ে খোঁজা
    let metadata = await FileMetadata.findOne({ slug: slug });

    // স্লাগ না পেলে permanentLinkId দিয়ে চেক
    if (!metadata) {
      metadata = await FileMetadata.findOne({ permanentLinkId: slug });
    }

    // permanentLinkId না পেলে fileId দিয়ে চেক (পুরানো লিংক সাপোর্ট)
    if (!metadata) {
      metadata = await FileMetadata.findOne({ fileId: slug });
    }

    if (!metadata) {
      return new NextResponse('ফাইল পাওয়া যায়নি', { status: 404 });
    }

    // ডাউনলোড কাউন্ট বাড়ানো
    metadata.downloadCount = (metadata.downloadCount || 0) + 1;
    await metadata.save();

    // GridFS থেকে ফাইল স্ট্রিম করা
    const gridFSBucket = getGridFSBucket();
    
    const files = await gridFSBucket.find({ 
      _id: new mongoose.Types.ObjectId(metadata.fileId) 
    }).toArray();
    
    if (files.length === 0) {
      return new NextResponse('ফাইল পাওয়া যায়নি', { status: 404 });
    }

    const downloadStream = gridFSBucket.openDownloadStream(
      new mongoose.Types.ObjectId(metadata.fileId)
    );

    const headers = new Headers();
    headers.set('Content-Type', metadata.contentType || 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(metadata.filename)}"`
    );
    headers.set('Content-Length', metadata.size.toString());

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