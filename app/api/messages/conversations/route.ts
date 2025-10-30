import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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
        const tokenCookie = parts.find(c => c.startsWith('client-token=') || c.startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in to view messages' },
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
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get conversations for the user (exclude deleted ones)
    const conversations = await db.collection('conversations')
      .find({
        participants: new ObjectId(userId),
        deleted_for: { $ne: new ObjectId(userId) } // Exclude if user deleted it
      })
      .sort({ updated_at: -1 })
      .toArray();
    
    // Format conversations with user details and last message
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get the other participant
        const otherUserId = conv.participants.find(
          (p: any) => p.toString() !== userId
        );
        
        if (!otherUserId) return null;
        
        // Get other user details
        const otherUser = await db.collection('users').findOne({
          _id: new ObjectId(otherUserId)
        });
        
        if (!otherUser) return null;
        
        // Get last message
        const lastMessage = await db.collection('messages')
          .findOne(
            { conversation_id: conv._id },
            { sort: { created_at: -1 } }
          );
        
        // Count unread messages
        const unreadCount = await db.collection('messages').countDocuments({
          conversation_id: conv._id,
          recipient_id: new ObjectId(userId),
          is_read: false
        });
        
        return {
          _id: conv._id.toString(),
          id: conv._id.toString(),
          user: {
            id: otherUser._id.toString(),
            username: otherUser.username,
            full_name: otherUser.full_name || otherUser.name || otherUser.username,
            avatar: otherUser.avatar_url || otherUser.avatar || '/placeholder-user.jpg',
            verified: otherUser.is_verified || false
          },
          participants: [
            {
              _id: otherUser._id.toString(),
              username: otherUser.username,
              full_name: otherUser.full_name || otherUser.name || otherUser.username,
              profile_picture: otherUser.avatar_url || otherUser.avatar || '/placeholder-user.jpg'
            }
          ],
          lastMessage: lastMessage ? {
            text: lastMessage.content,
            timestamp: lastMessage.created_at,
            isRead: lastMessage.is_read
          } : null,
          last_message: lastMessage ? {
            content: lastMessage.content,
            created_at: lastMessage.created_at
          } : null,
          unreadCount,
          updated_at: conv.updated_at
        };
      })
    );
    
    // Filter out null values
    const transformedConversations = formattedConversations.filter(c => c !== null);
    
    await client.close();
    
    return NextResponse.json({ conversations: transformedConversations });
    
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}