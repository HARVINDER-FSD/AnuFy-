import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    let userId: string;
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Connect to database
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get posts with user data
    const posts = await db.collection('posts').aggregate([
      { $sort: { created_at: -1 } },
      { $limit: limit + skip },
      { $skip: skip },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          caption: 1,
          media_urls: 1,
          media_type: 1,
          location: 1,
          created_at: 1,
          updated_at: 1,
          likes_count: 1,
          comments_count: 1,
          user: {
            _id: 1,
            username: 1,
            full_name: 1,
            avatar_url: 1,
            is_verified: 1
          }
        }
      }
    ]).toArray();
    
    await client.close();
    
    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      id: post._id.toString(),
      content: post.caption || '',
      media_urls: post.media_urls || [],
      media_type: post.media_type || 'text',
      location: post.location,
      created_at: post.created_at,
      updated_at: post.updated_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: 0,
      user: {
        id: post.user._id.toString(),
        username: post.user.username,
        full_name: post.user.full_name,
        avatar_url: post.user.avatar_url,
        is_verified: post.user.is_verified || false
      }
    }));
    
    return NextResponse.json({
      posts: formattedPosts,
      hasMore: posts.length === limit
    });
    
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}