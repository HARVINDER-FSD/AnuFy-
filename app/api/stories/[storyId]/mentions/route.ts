import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

// Get mentions for a story
export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get story with mentions
    const story = await db.collection('stories').findOne({
      _id: new ObjectId(storyId)
    });

    await client.close();

    if (!story) {
      return NextResponse.json(
        { message: 'Story not found' },
        { status: 404 }
      );
    }

    // Extract mentions from stickers
    const mentions = story.stickers?.filter((s: any) => s.type === 'mention') || [];
    
    return NextResponse.json({ mentions });

  } catch (error: any) {
    console.error('Error fetching mentions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Notify mentioned users
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
    
    const { storyId } = params;
    const body = await request.json();
    const { mentionedUsernames } = body;

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get story details
    const story = await db.collection('stories').findOne({
      _id: new ObjectId(storyId)
    });

    if (!story) {
      await client.close();
      return NextResponse.json(
        { message: 'Story not found' },
        { status: 404 }
      );
    }

    // Get mentioned users
    const mentionedUsers = await db.collection('users').find({
      username: { $in: mentionedUsernames }
    }).toArray();

    // Create notifications for each mentioned user
    const notifications = mentionedUsers.map(user => ({
      user_id: user._id,
      type: 'story_mention',
      from_user_id: new ObjectId(userId),
      story_id: new ObjectId(storyId),
      message: `mentioned you in their story`,
      read: false,
      created_at: new Date()
    }));

    if (notifications.length > 0) {
      await db.collection('notifications').insertMany(notifications);
    }

    await client.close();

    return NextResponse.json({
      message: 'Mentions notified successfully',
      notified: notifications.length
    });

  } catch (error: any) {
    console.error('Error notifying mentions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
