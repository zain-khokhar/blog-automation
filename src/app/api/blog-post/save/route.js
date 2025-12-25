import dbConnect from '@/lib/mongodb';
import BlogPost from '@/models/BlogPost';
import Version from '@/models/Version';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect();

    const {
      postId,
      content,
      htmlContent,
      metadata,
      seoScore,
      readabilityScore,
      wordCount,
    } = await req.json();

    let post;let savedVersion;

    if (postId && postId !== 'new') {
      // Update existing post
      post = await BlogPost.findByIdAndUpdate(
        postId,
        {
          content,
          htmlContent,
          ...metadata,
          seoScore,
          readabilityScore,
          wordCount,
        },
        { new: true, upsert: true }
      );

      // Create version history entry
      const version = new Version({
        postId: post._id,
        content,
        htmlContent,
        versionName: 'Auto-save',
        metadata: {
          wordCount,
          seoScore,
        },
      });
      savedVersion = await version.save();
    } else {
      // Create new post
      post = new BlogPost({
        title: metadata.metaTitle || 'Untitled Post',
        content,
        htmlContent,
        ...metadata,
        seoScore,
        readabilityScore,
        wordCount,
      });
      post = await post.save();

      // Create initial version
      const version = new Version({
        postId: post._id,
        content,
        htmlContent,
        versionName: 'Initial version',
        metadata: {
          wordCount,
          seoScore,
        },
      });
      savedVersion = await version.save();
    }

    return NextResponse.json({
      success: true,
      postId: post._id,
      versionId: savedVersion._id,
      message: 'Post saved successfully',
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      // Get all posts
      const posts = await BlogPost.find()
        .sort({ updatedAt: -1 })
        .select('title metaTitle slug status seoScore wordCount createdAt updatedAt')
        .limit(50);

      return NextResponse.json({ success: true, posts });
    }

    // Get specific post
    const post = await BlogPost.findById(postId);

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
