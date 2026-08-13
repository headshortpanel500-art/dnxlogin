// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { File } from '@/models/User';

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

    // ফাইলগুলো প্রসেস করা (১৫MB পর্যন্ত)
    const fileData = await Promise.all(
      files.map(async (file: any) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        if (buffer.length > 15 * 1024 * 1024) {
          throw new Error(`${file.name} ১৫MB এর বেশি`);
        }

        return {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: buffer.length,
          data: buffer,
        };
      })
    );

    let docId: string;

    // যদি replaceFileId থাকে, তাহলে পুরানো ফাইল রিপ্লেস করবো
    if (replaceFileId) {
      const existingFile = await File.findById(replaceFileId);
      
      if (!existingFile) {
        return NextResponse.json(
          { success: false, error: 'পুরানো ফাইল পাওয়া যায়নি' },
          { status: 404 }
        );
      }

      // পুরানো ফাইল ডেটা রিপ্লেস করা
      existingFile.files = fileData;
      existingFile.uploadedBy = 'admin';
      await existingFile.save();
      
      docId = existingFile._id;
    } else {
      // নতুন ফাইল আপলোড
      const newFile = new File({
        files: fileData,
        uploadedBy: 'admin',
      });
      await newFile.save();
      docId = newFile._id;
    }

    // প্রতিটি ফাইলের জন্য আলাদা আইডি জেনারেট করা
    const fileIds = fileData.map((_, index) => ({
      fileId: `${docId}_${index}`,
      filename: fileData[index].filename,
    }));

    return NextResponse.json({
      success: true,
      message: replaceFileId ? 'ফাইল আপডেট সফল!' : 'ফাইল আপলোড সফল!',
      docId: docId,
      fileIds: fileIds,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'আপলোড ব্যর্থ' },
      { status: 500 }
    );
  }
}