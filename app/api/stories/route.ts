import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Cache for stories (30 seconds for faster updates)
let storiesCache: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Get all stories
export async function GET(request: NextRequest) {
  try {
    // Check cache first for instant response
    const now = Date.now();
    if (storiesCache && (now - cacheTime) < CACHE_DURATION) {
      console.log('Returning cached stories (instant)');
      return NextResponse.json(storiesCache);
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const storiesCollection = db.collection('stories');
    
    // Get stories that haven't expired yet (optimized query)
    const currentDate = new Date();
    const stories = await storiesCollection
      .aggregate([
        {
          $match: { 
            expires_at: { $gt: currentDate },
            is_deleted: { $ne: true }
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $limit: 50 // Limit to 50 most recent stories
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
            media_url: 1,
            media_type: 1,
            caption: 1,
            texts: 1,
            stickers: 1,
            drawings: 1,
            filter: 1,
            music: 1,
            created_at: 1,
            views_count: 1,
            username: '$user.username',
            full_name: { $ifNull: ['$user.full_name', '$user.name'] },
            avatar_url: { $ifNull: ['$user.avatar_url', '$user.avatar', '/placeholder-user.jpg'] },
            is_verified: { $ifNull: ['$user.is_verified', '$user.verified', false] }
          }
        }
      ])
      .toArray();
    
    await client.close();
    
    // Transform the data to match expected format
    const transformedStories = stories.map(story => ({
      id: story._id.toString(),
      user_id: story.user_id.toString(),
      media_url: story.media_url,
      media_type: story.media_type,
      caption: story.caption,
      texts: story.texts || [],
      stickers: story.stickers || [],
      drawings: story.drawings || [],
      filter: story.filter || 'none',
      music: story.music || null,
      created_at: story.created_at,
      views_count: story.views_count || 0,
      username: story.username,
      full_name: story.full_name,
      avatar_url: story.avatar_url,
      is_verified: story.is_verified
    }));
    
    // Cache the results
    storiesCache = transformedStories;
    cacheTime = Date.now();
    console.log(`Cached ${transformedStories.length} stories`);
    
    // Return with cache headers for browser caching
    return NextResponse.json(transformedStories, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching stories:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new story
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
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to create a story' },
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
    
    const { media_url, media_type, caption, location, texts, stickers, drawings, filter, music } = body;
    
    // Validate required fields
    if (!media_url) {
      return NextResponse.json(
        { message: 'Media URL is required' },
        { status: 400 }
      );
    }
    
    if (!media_type) {
      return NextResponse.json(
        { message: 'Media type is required' },
        { status: 400 }
      );
    }
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const storiesCollection = db.collection('stories');
    
    // Create new story with all editing data
    const newStory = {
      user_id: new ObjectId(userId),
      media_url: media_url,
      media_type: media_type,
      caption: caption || null,
      location: location || null,
      texts: texts || [],
      stickers: stickers || [],
      drawings: drawings || [],
      filter: filter || 'none',
      music: music || null,
      views_count: 0,
      is_deleted: false,
      created_at: new Date(),
      expires_at: expiresAt
    };
    
    const result = await storiesCollection.insertOne(newStory);
    
    await client.close();
    
    // Clear cache when new story is created
    storiesCache = null;
    
    // Return the created story
    return NextResponse.json({
      id: result.insertedId.toString(),
      user_id: userId,
      media_url: newStory.media_url,
      media_type: newStory.media_type,
      caption: newStory.caption,
      location: newStory.location,
      texts: newStory.texts,
      stickers: newStory.stickers,
      drawings: newStory.drawings,
      filter: newStory.filter,
      music: newStory.music,
      views_count: newStory.views_count,
      created_at: newStory.created_at,
      expires_at: newStory.expires_at
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating story:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    return NextResponse.json(
      { message },
      { status }
    );
  }
}