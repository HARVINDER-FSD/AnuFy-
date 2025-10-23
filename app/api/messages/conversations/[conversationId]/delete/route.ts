import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Cache MongoDB connection
let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = await MongoClient.connect(MONGODB_URI);
  return cachedClient;
}

// Delete conversation and all its messages
export async function DELETE(
  request: NextRequest,
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
        { message: 'Unauthorized' },
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
    
    // Connect to MongoDB (using cached connection)
    const client = await getMongoClient();
    const db = client.db();
    
    // Check if user is participant in conversation
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(userId)
    });
    
    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }
    
    // Instead of deleting, hide the conversation for this user only
    // Add user to deleted_for array
    const updateResult = await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      { 
        $addToSet: { deleted_for: new ObjectId(userId) },
        $set: { updated_at: new Date() }
      }
    );
    
    // Mark all messages as deleted for this user
    const messagesUpdated = await db.collection('messages').updateMany(
      { conversation_id: new ObjectId(conversationId) },
      { 
        $addToSet: { deleted_for: new ObjectId(userId) }
      }
    );
    
    console.log(`Hidden conversation ${conversationId} for user ${userId}: ${messagesUpdated.modifiedCount} messages marked as deleted`);
    
    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
      messagesHidden: messagesUpdated.modifiedCount,
      conversationHidden: updateResult.modifiedCount
    });
    
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
