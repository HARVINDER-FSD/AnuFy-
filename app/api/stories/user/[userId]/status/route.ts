import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Get story status for a user (has stories, all viewed or not)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Get current user from token
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    let currentUserId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        currentUserId = decoded?.userId;
      } catch (error) {
        // Token invalid, continue without user
      }
    }
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get active stories for this user
    const currentDate = new Date();
    const stories = await db.collection('stories')
      .find({
        user_id: new ObjectId(userId),
        expires_at: { $gt: currentDate },
        is_deleted: { $ne: true }
      })
      .sort({ created_at: -1 })
      .toArray();
    
    if (stories.length === 0) {
      await client.close();
      return NextResponse.json({
        hasStories: false,
        allViewed: false,
        storyCount: 0
      });
    }
    
    // If no current user, return has stories but not viewed
    if (!currentUserId) {
      await client.close();
      return NextResponse.json({
        hasStories: true,
        allViewed: false,
        storyCount: stories.length
      });
    }
    
    // Check if current user has viewed all stories
    const storyIds = stories.map(s => s._id);
    const views = await db.collection('story_views')
      .find({
        story_id: { $in: storyIds },
        user_id: new ObjectId(currentUserId)
      })
      .toArray();
    
    await client.close();
    
    const allViewed = views.length === stories.length;
    
    return NextResponse.json({
      hasStories: true,
      allViewed,
      storyCount: stories.length,
      viewedCount: views.length
    });
    
  } catch (error: any) {
    console.error('Error checking story status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
