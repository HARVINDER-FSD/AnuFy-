import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

// Repost a story (when mentioned)
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

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get original story
    const originalStory = await db.collection('stories').findOne({
      _id: new ObjectId(storyId)
    });

    if (!originalStory) {
      await client.close();
      return NextResponse.json(
        { message: 'Story not found' },
        { status: 404 }
      );
    }

    // Check if user is mentioned in the story
    const mentions = originalStory.stickers?.filter((s: any) => s.type === 'mention') || [];
    const userMention = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    const isMentioned = mentions.some((m: any) => 
      m.data?.username === userMention?.username
    );

    if (!isMentioned) {
      await client.close();
      return NextResponse.json(
        { message: 'You are not mentioned in this story' },
        { status: 403 }
      );
    }

    // Create reposted story
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const repostedStory = {
      user_id: new ObjectId(userId),
      media_url: originalStory.media_url,
      media_type: originalStory.media_type,
      caption: null,
      location: null,
      texts: originalStory.texts || [],
      stickers: originalStory.stickers || [],
      drawings: originalStory.drawings || [],
      filter: originalStory.filter || 'none',
      music: originalStory.music || null,
      is_repost: true,
      original_story_id: originalStory._id,
      original_user_id: originalStory.user_id,
      views_count: 0,
      is_deleted: false,
      created_at: new Date(),
      expires_at: expiresAt
    };

    const result = await db.collection('stories').insertOne(repostedStory);

    // Notify original poster
    await db.collection('notifications').insertOne({
      user_id: originalStory.user_id,
      type: 'story_repost',
      from_user_id: new ObjectId(userId),
      story_id: result.insertedId,
      original_story_id: originalStory._id,
      message: `reposted your story`,
      read: false,
      created_at: new Date()
    });

    await client.close();

    return NextResponse.json({
      message: 'Story reposted successfully',
      story_id: result.insertedId.toString()
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error reposting story:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
