import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Record a story view
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
    const storyViewsCollection = db.collection('story_views');
    const storiesCollection = db.collection('stories');
    
    // Check if already viewed
    const existingView = await storyViewsCollection.findOne({
      story_id: new ObjectId(storyId),
      user_id: new ObjectId(userId)
    });
    
    if (!existingView) {
      // Record view
      await storyViewsCollection.insertOne({
        story_id: new ObjectId(storyId),
        user_id: new ObjectId(userId),
        created_at: new Date()
      });
      
      // Update view count
      await storiesCollection.updateOne(
        { _id: new ObjectId(storyId) },
        { $inc: { views_count: 1 } }
      );
    }
    
    await client.close();
    
    return NextResponse.json({
      message: 'View recorded'
    });
    
  } catch (error: any) {
    console.error('Error recording story view:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get story views (for story owner)
export async function GET(
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
    const storiesCollection = db.collection('stories');
    const storyViewsCollection = db.collection('story_views');
    
    // Verify story ownership
    const story = await storiesCollection.findOne({ _id: new ObjectId(storyId) });
    
    if (!story) {
      await client.close();
      return NextResponse.json(
        { message: 'Story not found' },
        { status: 404 }
      );
    }
    
    if (story.user_id.toString() !== userId) {
      await client.close();
      return NextResponse.json(
        { message: 'You can only view your own story views' },
        { status: 403 }
      );
    }
    
    const views = await storyViewsCollection
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
      count: views.length,
      views: views.map(view => ({
        user_id: view.user_id.toString(),
        username: view.username,
        full_name: view.full_name,
        avatar_url: view.avatar_url,
        viewed_at: view.created_at
      }))
    });
    
  } catch (error: any) {
    console.error('Error fetching story views:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
