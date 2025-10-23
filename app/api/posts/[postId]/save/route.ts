import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json({ message: 'You must be logged in to save posts' }, { status: 401 });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }

    const { action } = await request.json();
    const postId = params.postId;

    // Validate postId
    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    // Check if post exists
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      await client.close();
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    if (action === 'save') {
      // Check if already saved
      const existingSave = await db.collection('saved_posts').findOne({
        user_id: new ObjectId(decoded.userId),
        post_id: new ObjectId(postId)
      });

      if (existingSave) {
        await client.close();
        return NextResponse.json({ message: 'Post already saved' });
      }

      // Save the post
      await db.collection('saved_posts').insertOne({
        user_id: new ObjectId(decoded.userId),
        post_id: new ObjectId(postId),
        saved_at: new Date()
      });

      await client.close();
      return NextResponse.json({ message: 'Post saved successfully' });
    } else if (action === 'unsave') {
      // Remove the saved post
      const result = await db.collection('saved_posts').deleteOne({
        user_id: new ObjectId(decoded.userId),
        post_id: new ObjectId(postId)
      });

      await client.close();

      if (result.deletedCount === 0) {
        return NextResponse.json({ message: 'Post was not saved' });
      }

      return NextResponse.json({ message: 'Post unsaved successfully' });
    } else {
      await client.close();
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error saving/unsaving post:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json({ message: 'You must be logged in to check save status' }, { status: 401 });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }

    const postId = params.postId;

    // Validate postId
    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    // Check if post is saved by user
    const savedPost = await db.collection('saved_posts').findOne({
      user_id: new ObjectId(decoded.userId),
      post_id: new ObjectId(postId)
    });

    await client.close();

    return NextResponse.json({ isSaved: !!savedPost });
  } catch (error) {
    console.error('Error checking saved status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}