import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import Media from '@/models/Media';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const postId = formData.get('postId');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'media');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // File URL (accessible via /uploads/media/filename)
    const fileUrl = `/uploads/media/${filename}`;

    // Save to database
    await dbConnect();
    const mediaDoc = new Media({
      postId: postId && postId !== 'temp' ? postId : null,
      filename: originalName,
      fileUrl,
      fileType: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
      mimeType: file.type,
      fileSize: file.size,
    });

    await mediaDoc.save();

    return NextResponse.json({
      success: true,
      url: fileUrl,
      mediaId: mediaDoc._id,
      filename: originalName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}

// Configure for larger file uploads (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
