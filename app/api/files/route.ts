// app/api/files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { File } from '@/models/User';

// সব ফাইলের তালিকা
export async function GET() {
  try {
    await connectDB();

    const files = await File.find({})
      .sort({ createdAt: -1 })
      .select('files filename size uploadDate downloadCount createdAt');

    const formattedFiles = files.flatMap((doc: any) =>
      doc.files.map((file: any, index: number) => ({
        _id: doc._id,
        fileId: `${doc._id}_${index}`,
        filename: file.filename,
        contentType: file.contentType,
        size: file.size,
        uploadDate: file.uploadDate || doc.createdAt,
        downloadCount: doc.downloadCount || 0,
        fileIndex: index,
      }))
    );

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
    const [docId, fileIndex] = fileId.split('_');

    if (!docId || fileIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    const fileDoc = await File.findById(docId);

    if (!fileDoc) {
      return NextResponse.json(
        { success: false, error: 'ফাইল পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    const index = parseInt(fileIndex);

    // যদি শুধু একটি ফাইল থাকে, পুরো ডকুমেন্ট ডিলিট
    if (fileDoc.files.length === 1) {
      await File.findByIdAndDelete(docId);
    } else {
      // নির্দিষ্ট ফাইলটি সরানো
      fileDoc.files.splice(index, 1);
      await fileDoc.save();
    }

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