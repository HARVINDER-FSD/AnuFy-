import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

// Get a specific post by ID
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    const post = await db.collection('posts').findOne({
      _id: new ObjectId(postId),
      is_archived: false
    });

    if (!post) {
      await client.close();
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }

    // Get user info
    const user = await db.collection('users').findOne({
      _id: post.user_id
    });

    await client.close();

    return NextResponse.json({
      id: post._id.toString(),
      user_id: post.user_id.toString(),
      caption: post.caption,
      media_urls: post.media_urls,
      media_type: post.media_type,
      location: post.location,
      created_at: post.created_at,
      updated_at: post.updated_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      username: user?.username,
      full_name: user?.name,
      avatar_url: user?.avatar,
      is_verified: user?.verified || false
    });

  } catch (error: any) {
    console.error('Error fetching post:', error);

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a post
export async function PUT(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.split(' ')[1];
    const decoded = jwt.verify(accessToken, JWT_SECRET) as any;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    // Check if the post exists and belongs to the user
    const post = await db.collection('posts').findOne({
      _id: new ObjectId(postId),
      is_archived: false
    });

    if (!post) {
      await client.close();
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.user_id.toString() !== userId) {
      await client.close();
      return NextResponse.json(
        { message: 'You are not authorized to update this post' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { caption, location } = body;

    const updateFields: any = {
      updated_at: new Date()
    };

    if (caption !== undefined) {
      updateFields.caption = caption;
    }

    if (location !== undefined) {
      updateFields.location = location;
    }

    // Update the post
    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $set: updateFields }
    );

    await client.close();

    return NextResponse.json({
      message: 'Post updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating post:', error);

    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return NextResponse.json(
      { message },
      { status }
    );
  }
}

// Delete a post
export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.split(' ')[1];
    const decoded = jwt.verify(accessToken, JWT_SECRET) as any;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    // Check if the post exists and belongs to the user
    const post = await db.collection('posts').findOne({
      _id: new ObjectId(postId),
      is_archived: false
    });

    if (!post) {
      await client.close();
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.user_id.toString() !== userId) {
      await client.close();
      return NextResponse.json(
        { message: 'You are not authorized to delete this post' },
        { status: 403 }
      );
    }

    // Soft delete the post
    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          is_archived: true,
          updated_at: new Date()
        }
      }
    );

    await client.close();

    return NextResponse.json(
      { message: 'Post deleted successfully' }
    );

  } catch (error: any) {
    console.error('Error deleting post:', error);

    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return NextResponse.json(
      { message },
      { status }
    );
  }
}
