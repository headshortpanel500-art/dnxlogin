// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { FileMetadata } from '@/models/User';
import { getGridFSBucket } from '@/lib/gridfs';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

// ✅ ফাইলের নাম থেকে স্লাগ তৈরি করার ফাংশন
function generateSlug(filename: string): string {
  // ফাইলের নাম থেকে এক্সটেনশন আলাদা করা
  const lastDotIndex = filename.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  // স্পেশাল ক্যারেক্টার সরানো
  let slug = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // অক্ষর ও সংখ্যা ছাড়া সব কিছু ড্যাশ
    .replace(/-+/g, '-') // একাধিক ড্যাশ একটিতে রূপান্তর
    .replace(/^-|-$/g, ''); // শুরু ও শেষের ড্যাশ সরানো
  
  // যদি slug খালি হয়, তাহলে র্যান্ডম আইডি ব্যবহার
  if (!slug) {
    slug = randomUUID().substring(0, 8);
  }
  
  // এক্সটেনশন যোগ করা
  return slug + ext;
}

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
    const IS_VERCEL = process.env.VERCEL === '1';
    const MAX_FILE_SIZE = IS_VERCEL ? 4 * 1024 * 1024 : 50 * 1024 * 1024;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { 
            success: false, 
            error: IS_VERCEL 
              ? `${file.name} ৪MB এর বেশি! (Vercel লিমিট)` 
              : `${file.name} ৫০MB এর বেশি!` 
          },
          { status: 400 }
        );
      }

      let permanentLinkId: string;
      let slug: string;

      if (replaceFileId) {
        // পুরানো মেটাডেটা খোঁজা
        const existingMetadata = await FileMetadata.findOne({ fileId: replaceFileId });
        
        if (existingMetadata) {
          // পুরানো লিংক আইডি ও স্লাগ রাখা
          permanentLinkId = existingMetadata.permanentLinkId;
          slug = existingMetadata.slug; // ✅ পুরানো স্লাগ রাখা
          
          // GridFS থেকে পুরানো ফাইল ডিলিট
          try {
            await gridFSBucket.delete(new mongoose.Types.ObjectId(replaceFileId));
          } catch (error) {
            console.error('Failed to delete old file:', error);
          }
          
          // পুরানো মেটাডেটা ডিলিট
          await FileMetadata.deleteOne({ fileId: replaceFileId });
        } else {
          permanentLinkId = randomUUID();
          slug = generateSlug(file.name);
        }
      } else {
        // নতুন ফাইলের জন্য
        permanentLinkId = randomUUID();
        slug = generateSlug(file.name);
        
        // ✅ ডুপ্লিকেট স্লাগ চেক
        const existingSlug = await FileMetadata.findOne({ slug });
        if (existingSlug) {
          // একই নামের ফাইল থাকলে র্যান্ডম আইডি যোগ
          const randomSuffix = randomUUID().substring(0, 6);
          const lastDotIndex = slug.lastIndexOf('.');
          if (lastDotIndex > 0) {
            slug = slug.substring(0, lastDotIndex) + '-' + randomSuffix + slug.substring(lastDotIndex);
          } else {
            slug = slug + '-' + randomSuffix;
          }
        }
      }

      // GridFS-এ ফাইল আপলোড
      const uploadStream = gridFSBucket.openUploadStream(file.name, {
        contentType: file.type || 'application/octet-stream',
        metadata: {
          originalName: file.name,
          uploadedAt: new Date(),
          permanentLinkId: permanentLinkId,
          slug: slug, // ✅ স্লাগ মেটাডেটায় যোগ
        },
      });

      const gridFSFileId = uploadStream.id;
      const readableStream = Readable.from(buffer);
      
      await new Promise((resolve, reject) => {
        readableStream
          .pipe(uploadStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      // মেটাডেটা সেভ করা
      const metadata = new FileMetadata({
        filename: file.name,
        slug: slug, // ✅ স্লাগ সেভ
        contentType: file.type || 'application/octet-stream',
        size: buffer.length,
        fileId: gridFSFileId.toString(),
        permanentLinkId: permanentLinkId,
        uploadedBy: 'admin',
      });

      await metadata.save();
      
      uploadedFileIds.push({
        fileId: gridFSFileId.toString(),
        permanentLinkId: permanentLinkId,
        slug: slug,
        filename: file.name,
        downloadLink: `/download/${slug}`, // ✅ নাম দিয়ে লিংক
      });
    }

    return NextResponse.json({
      success: true,
      message: replaceFileId ? 'ফাইল আপডেট সফল! লিংক একই থাকবে ✅' : 'ফাইল আপলোড সফল!',
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