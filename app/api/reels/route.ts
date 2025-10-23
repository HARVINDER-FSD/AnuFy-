import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

// Get all reels with pagination
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=')) || parts.find(c => c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    const reels = await db.collection('reels')
      .aggregate([
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limit },
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
            user_id: 1,
            video_url: 1,
            thumbnail_url: 1,
            caption: 1,
            location: 1,
            likes_count: 1,
            comments_count: 1,
            views_count: 1,
            created_at: 1,
            updated_at: 1,
            user: {
              _id: 1,
              username: 1,
              full_name: 1,
              avatar_url: 1,
              is_verified: 1
            }
          }
        }
      ])
      .toArray();

    await client.close();

    const transformedReels = reels.map(reel => ({
      id: reel._id.toString(),
      user_id: reel.user_id.toString(),
      video_url: reel.video_url,
      thumbnail_url: reel.thumbnail_url,
      caption: reel.caption,
      location: reel.location,
      likes_count: reel.likes_count || 0,
      comments_count: reel.comments_count || 0,
      views_count: reel.views_count || 0,
      created_at: reel.created_at,
      updated_at: reel.updated_at,
      user: {
        id: reel.user._id.toString(),
        username: reel.user.username,
        full_name: reel.user.full_name,
        avatar_url: reel.user.avatar_url,
        is_verified: reel.user.is_verified || false
      }
    }));

    return NextResponse.json({ reels: transformedReels });

  } catch (error: any) {
    console.error('Error fetching reels:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Create a new reel
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=')) || parts.find(c => c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }

    if (!token) {
      return NextResponse.json({ message: 'You must be logged in to create a reel' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await request.json();
    const { video_url, thumbnail_url, caption, location } = body;

    if (!video_url) {
      return NextResponse.json({ message: 'Video URL is required' }, { status: 400 });
    }

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    const newReel = {
      user_id: new ObjectId(userId),
      video_url: video_url,
      thumbnail_url: thumbnail_url || video_url,
      caption: caption || '',
      location: location || null,
      likes_count: 0,
      comments_count: 0,
      views_count: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('reels').insertOne(newReel);

    await client.close();

    return NextResponse.json({
      id: result.insertedId.toString(),
      user_id: userId,
      video_url: newReel.video_url,
      thumbnail_url: newReel.thumbnail_url,
      caption: newReel.caption,
      location: newReel.location,
      likes_count: newReel.likes_count,
      comments_count: newReel.comments_count,
      views_count: newReel.views_count,
      created_at: newReel.created_at,
      updated_at: newReel.updated_at
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating reel:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}