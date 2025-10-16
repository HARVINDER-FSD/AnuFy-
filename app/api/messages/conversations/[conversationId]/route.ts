import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Get conversation details
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('client-token=') || c.startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
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
    
    const userId = decoded.userId;
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get conversation
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(userId)
    });
    
    if (!conversation) {
      await client.close();
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Get other participant
    const otherParticipantId = conversation.participants.find((p: any) => 
      p.toString() !== userId
    );
    
    if (!otherParticipantId) {
      await client.close();
      return NextResponse.json(
        { message: 'Invalid conversation - no other participant found' },
        { status: 400 }
      );
    }
    
    // Get other user details with all possible field names
    const otherUser = await db.collection('users').findOne(
      { _id: new ObjectId(otherParticipantId) }
    );
    
    await client.close();
    
    if (!otherUser) {
      return NextResponse.json(
        { message: 'Other user not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      _id: conversation._id.toString(),
      participants: conversation.participants.map((p: any) => p.toString()),
      otherUser: {
        _id: otherUser._id.toString(),
        username: otherUser.username,
        full_name: otherUser.full_name || otherUser.name || otherUser.username,
        avatar: otherUser.avatar_url || otherUser.avatar || '/placeholder-user.jpg',
        is_verified: otherUser.is_verified || false
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// This route returns conversation details
// For messages, use /api/messages/conversations/[conversationId]/messages