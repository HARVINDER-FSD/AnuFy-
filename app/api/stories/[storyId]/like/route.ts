import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { notifyStoryLike } from '@/lib/notification-service';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Like/Unlike a story
export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    // Get token
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
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const storyId = params.storyId;
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const storyLikesCollection = db.collection('story_likes');
    
    // Check if already liked
    const existingLike = await storyLikesCollection.findOne({
      story_id: new ObjectId(storyId),
      user_id: new ObjectId(userId)
    });
    
    if (existingLike) {
      // Unlike
      await storyLikesCollection.deleteOne({ _id: existingLike._id });
      await client.close();
      
      return NextResponse.json({
        liked: false,
        message: 'Story unliked'
      });
    } else {
      // Like
      await storyLikesCollection.insertOne({
        story_id: new ObjectId(storyId),
        user_id: new ObjectId(userId),
        created_at: new Date()
      });
      
      // Get story owner to send notification
      const story = await db.collection('stories').findOne({ _id: new ObjectId(storyId) });
      if (story && story.user_id && story.user_id.toString() !== userId) {
        await notifyStoryLike(story.user_id.toString(), userId, storyId).catch(() => {});
      }
      
      await client.close();
      
      return NextResponse.json({
        liked: true,
        message: 'Story liked'
      });
    }
    
  } catch (error: any) {
    console.error('Error liking story:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get story likes
export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const storyId = params.storyId;
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const storyLikesCollection = db.collection('story_likes');
    
    const likes = await storyLikesCollection
      .aggregate([
        {
          $match: { story_id: new ObjectId(storyId) }
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
            user_id: 1,
            username: '$user.username',
            full_name: { $ifNull: ['$user.full_name', '$user.name'] },
            avatar_url: { $ifNull: ['$user.avatar_url', '$user.avatar', '/placeholder-user.jpg'] },
            created_at: 1
          }
        },
        {
          $sort: { created_at: -1 }
        }
      ])
      .toArray();
    
    await client.close();
    
    return NextResponse.json({
      count: likes.length,
      likes: likes.map(like => ({
        user_id: like.user_id.toString(),
        username: like.username,
        full_name: like.full_name,
        avatar_url: like.avatar_url,
        created_at: like.created_at
      }))
    });
    
  } catch (error: any) {
    console.error('Error fetching story likes:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
