import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = await MongoClient.connect(MONGODB_URI);
  return cachedClient;
}

// Add or remove reaction to a message
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string; messageId: string } }
) {
  try {
    const { conversationId, messageId } = params;
    
    // Get token
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
        { message: 'You must be logged in to react to messages' },
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
    const body = await request.json();
    const { emoji } = body;
    
    if (!emoji) {
      return NextResponse.json(
        { message: 'Emoji is required' },
        { status: 400 }
      );
    }
    
    const client = await getMongoClient();
    const db = client.db();
    
    // Check if message exists
    const message = await db.collection('messages').findOne({
      _id: new ObjectId(messageId),
      conversation_id: new ObjectId(conversationId)
    });
    
    if (!message) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Check if user already reacted with this emoji
    const reactions = message.reactions || [];
    const existingReactionIndex = reactions.findIndex(
      (r: any) => r.user_id.toString() === userId && r.emoji === emoji
    );
    
    let updatedReactions;
    let action: 'added' | 'removed';
    
    if (existingReactionIndex !== -1) {
      // Remove reaction if it exists
      updatedReactions = reactions.filter((_: any, index: number) => index !== existingReactionIndex);
      action = 'removed';
    } else {
      // Check if user has any other reaction on this message
      const userReactionIndex = reactions.findIndex(
        (r: any) => r.user_id.toString() === userId
      );
      
      if (userReactionIndex !== -1) {
        // Replace existing reaction with new one
        updatedReactions = [...reactions];
        updatedReactions[userReactionIndex] = {
          user_id: new ObjectId(userId),
          emoji: emoji,
          created_at: new Date()
        };
      } else {
        // Add new reaction
        updatedReactions = [
          ...reactions,
          {
            user_id: new ObjectId(userId),
            emoji: emoji,
            created_at: new Date()
          }
        ];
      }
      action = 'added';
    }
    
    // Update message with new reactions
    await db.collection('messages').updateOne(
      { _id: new ObjectId(messageId) },
      { 
        $set: { 
          reactions: updatedReactions,
          updated_at: new Date()
        } 
      }
    );
    
    // Transform reactions for response
    const transformedReactions = updatedReactions.map((r: any) => ({
      user_id: r.user_id.toString(),
      emoji: r.emoji,
      created_at: r.created_at
    }));
    
    return NextResponse.json({
      action,
      reactions: transformedReactions
    });
    
  } catch (error: any) {
    console.error('Error reacting to message:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
