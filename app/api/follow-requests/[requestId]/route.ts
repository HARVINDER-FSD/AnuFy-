import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Accept or reject follow request
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;
    const { action } = await request.json(); // 'accept' or 'reject'
    
    // Get token from Authorization header or cookies
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
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in' },
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
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get the follow request
    const followRequest = await db.collection('follow_requests').findOne({
      _id: new ObjectId(requestId),
      following_id: new ObjectId(currentUserId) // Must be the recipient
    });
    
    if (!followRequest) {
      await client.close();
      return NextResponse.json(
        { message: 'Follow request not found' },
        { status: 404 }
      );
    }
    
    const followerId = followRequest.follower_id;
    
    if (action === 'accept') {
      // Create the follow relationship
      await db.collection('follows').insertOne({
        follower_id: followerId,
        following_id: new ObjectId(currentUserId),
        created_at: new Date()
      });
      
      // Update follower counts
      await db.collection('users').updateOne(
        { _id: followerId },
        { $inc: { following_count: 1 } }
      );
      
      await db.collection('users').updateOne(
        { _id: new ObjectId(currentUserId) },
        { $inc: { followers_count: 1 } }
      );
      
      // Delete the follow request
      await db.collection('follow_requests').deleteOne({
        _id: new ObjectId(requestId)
      });
      
      // Create notification for the requester
      await db.collection('notifications').insertOne({
        user_id: followerId,
        actor_id: new ObjectId(currentUserId),
        type: 'follow_accept',
        content: 'accepted your follow request',
        is_read: false,
        created_at: new Date()
      });
      
      await client.close();
      
      return NextResponse.json({
        success: true,
        message: 'Follow request accepted'
      });
    } else if (action === 'reject') {
      // Just delete the follow request (no notification)
      await db.collection('follow_requests').deleteOne({
        _id: new ObjectId(requestId)
      });
      
      await client.close();
      
      return NextResponse.json({
        success: true,
        message: 'Follow request rejected'
      });
    } else {
      await client.close();
      return NextResponse.json(
        { message: 'Invalid action. Use "accept" or "reject"' },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('Error handling follow request:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
