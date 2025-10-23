import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get all following
    const follows = await db.collection('follows')
      .find({ follower_id: new ObjectId(userId) })
      .toArray();
    
    // Get user details for each following
    const followingIds = follows.map(f => f.following_id);
    const users = await db.collection('users')
      .find({ _id: { $in: followingIds } })
      .toArray();
    
    const following = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      full_name: user.full_name || user.name || user.username,
      avatar: user.avatar_url || user.avatar || '/placeholder-user.jpg',
      bio: user.bio || '',
      is_verified: user.is_verified || false
    }));
    
    await client.close();
    
    return NextResponse.json({ following });
    
  } catch (error: any) {
    console.error('Error fetching following:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
