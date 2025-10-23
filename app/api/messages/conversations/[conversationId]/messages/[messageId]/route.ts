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

// Delete a message (unsend)
export async function DELETE(
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
        { message: 'You must be logged in to delete messages' },
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
    
    const client = await getMongoClient();
    const db = client.db();
    
    // Check if message exists and user is the sender
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
    
    // Check if user is the sender
    if (message.sender_id.toString() !== userId) {
      return NextResponse.json(
        { message: 'You can only delete your own messages' },
        { status: 403 }
      );
    }
    
    // Delete the message
    await db.collection('messages').deleteOne({
      _id: new ObjectId(messageId)
    });
    
    return NextResponse.json({
      message: 'Message deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting message:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
