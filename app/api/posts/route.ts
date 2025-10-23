import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { FeedCache, CacheInvalidation } from '@/lib/cache-utils';
import { queue } from '@/lib/queue';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

// Get all posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Try to get from cache first (only for first page)
    if (offset === 0) {
      const cachedFeed = await FeedCache.getFeed('global');
      if (cachedFeed) {
        return NextResponse.json(cachedFeed);
      }
    }
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const postsCollection = db.collection('posts');
    const usersCollection = db.collection('users');
    
    // Get posts with user information
    const posts = await postsCollection
      .aggregate([
        {
          $match: { is_archived: { $ne: true } }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 1,
            user_id: 1,
            caption: 1,
            media_urls: 1,
            media_type: 1,
            location: 1,
            created_at: 1,
            updated_at: 1,
            likes_count: 1,
            comments_count: 1,
            'user.username': 1,
            'user.name': 1,
            'user.avatar': 1,
            'user.verified': 1
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ])
      .toArray();
    
    await client.close();
    
    // Transform the data to match expected format
    const transformedPosts = posts.map(post => ({
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
      username: post.user.username,
      full_name: post.user.name,
      avatar_url: post.user.avatar,
      is_verified: post.user.verified || false
    }));
    
    // Cache the feed for future requests (only first page)
    if (offset === 0) {
      await FeedCache.setFeed('global', transformedPosts);
    }
    
    return NextResponse.json(transformedPosts);
    
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new post
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Check for token in cookies as fallback
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=')) || parts.find(c => c.startsWith('client-token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to create a post' },
        { status: 401 }
      );
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    const userId = decoded.userId;
    const body = await request.json();
    
    const { content, location, media_urls, media_type } = body;
    
    // Validate required fields
    if (!content && (!media_urls || media_urls.length === 0)) {
      return NextResponse.json(
        { message: 'Post content or media is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const postsCollection = db.collection('posts');
    
    // Create new post
    const newPost = {
      user_id: new ObjectId(userId),
      caption: content || '',
      media_urls: media_urls || [],
      media_type: media_type || 'text',
      location: location || null,
      likes_count: 0,
      comments_count: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await postsCollection.insertOne(newPost);
    
    // Update user's post count
    const usersCollection = db.collection('users');
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { posts_count: 1 } }
    );
    
    await client.close();
    
    // Invalidate cache when new post is created
    await CacheInvalidation.onPostCreate(userId);
    
    // Queue background tasks
    await queue.enqueue('update_user_stats', {
      userId,
      stats: { last_post_created: new Date() }
    }, 2);
    
    // Return the created post
    return NextResponse.json({
      id: result.insertedId.toString(),
      user_id: userId,
      caption: newPost.caption,
      media_urls: newPost.media_urls,
      media_type: newPost.media_type,
      location: newPost.location,
      likes_count: newPost.likes_count,
      comments_count: newPost.comments_count,
      created_at: newPost.created_at,
      updated_at: newPost.updated_at
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating post:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    return NextResponse.json(
      { message },
      { status }
    );
  }
}