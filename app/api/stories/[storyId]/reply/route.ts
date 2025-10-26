import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { notifyStoryReply } from '@/lib/notification-service';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Reply to a story
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
    
    const body = await request.json();
    const { message } = body;
    
    if (!message || !message.trim()) {
      return NextResponse.json(
        { message: 'Reply message is required' },
        { status: 400 }
      );
    }
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const storiesCollection = db.collection('stories');
    const storyRepliesCollection = db.collection('story_replies');
    
    // Get story to find owner
    const story = await storiesCollection.findOne({ _id: new ObjectId(storyId) });
    
    if (!story) {
      await client.close();
      return NextResponse.json(
        { message: 'Story not found' },
        { status: 404 }
      );
    }
    
    // Create reply
    const reply = await storyRepliesCollection.insertOne({
      story_id: new ObjectId(storyId),
      story_owner_id: story.user_id,
      sender_id: new ObjectId(userId),
      message: message.trim(),
      is_read: false,
      created_at: new Date()
    });
    
    // Send notification to story owner
    if (story.user_id && story.user_id.toString() !== userId) {
      await notifyStoryReply(story.user_id.toString(), userId, storyId, message.trim()).catch(() => {});
    }
    
    await client.close();
    
    return NextResponse.json({
      id: reply.insertedId.toString(),
      message: 'Reply sent successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error replying to story:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get story replies (for story owner)
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
    const storyRepliesCollection = db.collection('story_replies');
    
    const replies = await storyRepliesCollection
      .aggregate([
        {
          $match: { 
            story_id: new ObjectId(storyId),
            story_owner_id: new ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sender_id',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $unwind: '$sender'
        },
        {
          $project: {
            message: 1,
            is_read: 1,
            created_at: 1,
            sender: {
              id: '$sender._id',
              username: '$sender.username',
              full_name: { $ifNull: ['$sender.full_name', '$sender.name'] },
              avatar_url: { $ifNull: ['$sender.avatar_url', '$sender.avatar', '/placeholder-user.jpg'] }
            }
          }
        },
        {
          $sort: { created_at: -1 }
        }
      ])
      .toArray();
    
    await client.close();
    
    return NextResponse.json({
      count: replies.length,
      replies: replies.map(reply => ({
        id: reply._id.toString(),
        message: reply.message,
        is_read: reply.is_read,
        created_at: reply.created_at,
        sender: {
          id: reply.sender.id.toString(),
          username: reply.sender.username,
          full_name: reply.sender.full_name,
          avatar_url: reply.sender.avatar_url
        }
      }))
    });
    
  } catch (error: any) {
    console.error('Error fetching story replies:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
