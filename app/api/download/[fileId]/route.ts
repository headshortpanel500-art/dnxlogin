// app/api/download/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { File } from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> } // ১. Promise টাইপ দেওয়া হলো
) {
  try {
    await connectDB();

    const { fileId } = await params; // ২. params await করা হলো
    const [docId, fileIndex] = fileId.split('_');

    if (!docId || fileIndex === undefined) {
      return new NextResponse('Invalid file ID', { status: 400 });
    }

    const fileDoc = await File.findById(docId);

    if (!fileDoc) {
      return new NextResponse('ফাইল পাওয়া যায়নি', { status: 404 });
    }

    const index = parseInt(fileIndex);
    const fileData = fileDoc.files[index];

    if (!fileData) {
      return new NextResponse('ফাইল পাওয়া যায়নি🚫', { status: 404 });
    }

    // ডাউনলোড কাউন্ট বাড়ানো
    fileDoc.downloadCount = (fileDoc.downloadCount || 0) + 1;
    await fileDoc.save();

    const headers = new Headers();
    headers.set('Content-Type', fileData.contentType);
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileData.filename)}"`
    );
    headers.set('Content-Length', fileData.size.toString());

    return new NextResponse(fileData.data, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return new NextResponse('ডাউনলোড করতে সমস্যা হয়েছে', { status: 500 });
  }
}