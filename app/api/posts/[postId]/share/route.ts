import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
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
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if post exists
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
    
    // Increment shares count
    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { shares_count: 1 } }
    );
    
    await client.close();
    
    return NextResponse.json({
      message: 'Post shared successfully',
      shares_count: (post.shares_count || 0) + 1
    });
    
  } catch (error: any) {
    console.error('Error sharing post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to share post' },
      { status: 500 }
    );
  }
}
