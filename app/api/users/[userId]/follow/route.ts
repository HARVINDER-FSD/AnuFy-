import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Follow/Unfollow a user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const targetUserId = params.userId;
    
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
        const tokenCookie = parts.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to follow users' },
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
    
    const currentUserId = decoded.userId;
    
    // Prevent self-following
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { message: 'You cannot follow yourself' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if target user exists
    const targetUser = await db.collection('users').findOne({
      _id: new ObjectId(targetUserId)
    });
    
    if (!targetUser) {
      await client.close();
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if already following
    const existingFollow = await db.collection('follows').findOne({
      follower_id: new ObjectId(currentUserId),
      following_id: new ObjectId(targetUserId)
    });
    
    // Check if there's a pending follow request
    const existingRequest = await db.collection('follow_requests').findOne({
      follower_id: new ObjectId(currentUserId),
      following_id: new ObjectId(targetUserId)
    });
    
    let isFollowing = false;
    let isPending = false;
    
    if (existingFollow) {
      // Unfollow the user
      await db.collection('follows').deleteOne({
        follower_id: new ObjectId(currentUserId),
        following_id: new ObjectId(targetUserId)
      });
      
      // Update follower counts
      await db.collection('users').updateOne(
        { _id: new ObjectId(currentUserId) },
        { $inc: { following_count: -1 } }
      );
      
      await db.collection('users').updateOne(
        { _id: new ObjectId(targetUserId) },
        { $inc: { followers_count: -1 } }
      );
      
      isFollowing = false;
    } else if (existingRequest) {
      // Cancel the follow request
      await db.collection('follow_requests').deleteOne({
        follower_id: new ObjectId(currentUserId),
        following_id: new ObjectId(targetUserId)
      });
      
      isPending = false;
    } else {
      // Check if target user has a private account
      const isPrivate = targetUser.is_private || false;
      
      if (isPrivate) {
        // Create a follow request instead of direct follow
        await db.collection('follow_requests').insertOne({
          follower_id: new ObjectId(currentUserId),
          following_id: new ObjectId(targetUserId),
          status: 'pending',
          created_at: new Date()
        });
        
        // Create notification for follow request
        await db.collection('notifications').insertOne({
          user_id: new ObjectId(targetUserId),
          actor_id: new ObjectId(currentUserId),
          type: 'follow_request',
          content: 'requested to follow you',
          is_read: false,
          created_at: new Date()
        });
        
        isPending = true;
      } else {
        // Public account - follow immediately
        await db.collection('follows').insertOne({
          follower_id: new ObjectId(currentUserId),
          following_id: new ObjectId(targetUserId),
          created_at: new Date()
        });
        
        // Update follower counts
        await db.collection('users').updateOne(
          { _id: new ObjectId(currentUserId) },
          { $inc: { following_count: 1 } }
        );
        
        await db.collection('users').updateOne(
          { _id: new ObjectId(targetUserId) },
          { $inc: { followers_count: 1 } }
        );
        
        // Create notification for the followed user
        await db.collection('notifications').insertOne({
          user_id: new ObjectId(targetUserId),
          actor_id: new ObjectId(currentUserId),
          type: 'follow',
          content: 'started following you',
          is_read: false,
          created_at: new Date()
        });
        
        isFollowing = true;
      }
    }
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      is_following: isFollowing,
      is_pending: isPending,
      message: isFollowing 
        ? 'Successfully followed user' 
        : isPending 
          ? 'Follow request sent' 
          : 'Successfully unfollowed user'
    });
    
  } catch (error: any) {
    console.error('Error following/unfollowing user:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}