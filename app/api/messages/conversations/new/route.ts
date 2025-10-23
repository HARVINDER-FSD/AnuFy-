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


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      );
    }
    
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
    
    const currentUserId = decoded.userId;
    
    // Connect to MongoDB (using cached connection)
    const client = await getMongoClient();
    const db = client.db();
    
    // Find the target user by username
    const targetUser = await db.collection('users').findOne({ username });
    
    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    const targetUserId = targetUser._id.toString();
    
    // Check if current user is blocked by target user
    const isBlocked = await db.collection('user_blocks').findOne({
      blocker_id: new ObjectId(targetUserId),
      blocked_id: new ObjectId(currentUserId)
    });
    
    if (isBlocked) {
      return NextResponse.json({
        message: 'Unable to send message to this user'
      }, { status: 403 });
    }
    
    // Check if users follow each other
    const isFollowing = await db.collection('follows').findOne({
      follower_id: new ObjectId(currentUserId),
      following_id: new ObjectId(targetUserId)
    });
    
    // Check if conversation already exists (including deleted ones)
    const existingConversation = await db.collection('conversations').findOne({
      participants: {
        $all: [new ObjectId(currentUserId), new ObjectId(targetUserId)]
      }
    });
    
    if (existingConversation) {
      // If conversation was deleted by current user, restore it
      if (existingConversation.deleted_for && 
          existingConversation.deleted_for.some((id: any) => id.toString() === currentUserId)) {
        await db.collection('conversations').updateOne(
          { _id: existingConversation._id },
          { 
            $pull: { deleted_for: new ObjectId(currentUserId) },
            $set: { updated_at: new Date() }
          }
        );
        
        // Also restore messages for this user
        await db.collection('messages').updateMany(
          { conversation_id: existingConversation._id },
          { $pull: { deleted_for: new ObjectId(currentUserId) } }
        );
      }
      
      return NextResponse.json({
        success: true,
        conversationId: existingConversation._id.toString(),
        isRequest: false,
        message: 'Conversation restored'
      });
    }
    
    // If not following, create message request instead
    if (!isFollowing) {
      // Check if request already exists
      const existingRequest = await db.collection('message_requests').findOne({
        from_user_id: new ObjectId(currentUserId),
        to_user_id: new ObjectId(targetUserId),
        status: 'pending'
      });
      
      if (existingRequest) {
        return NextResponse.json({
          success: true,
          requestId: existingRequest._id.toString(),
          isRequest: true,
          message: 'Message request already sent'
        });
      }
      
      // Create conversation but mark as request
      const newConversation = {
        participants: [new ObjectId(currentUserId), new ObjectId(targetUserId)],
        type: 'direct',
        is_request: true,
        created_by: new ObjectId(currentUserId),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const convResult = await db.collection('conversations').insertOne(newConversation);
      
      // Create message request
      const messageRequest = {
        from_user_id: new ObjectId(currentUserId),
        to_user_id: new ObjectId(targetUserId),
        conversation_id: convResult.insertedId,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await db.collection('message_requests').insertOne(messageRequest);
      
      return NextResponse.json({
        success: true,
        conversationId: convResult.insertedId.toString(),
        isRequest: true,
        message: 'Message request created'
      });
    }
    
    // Create normal conversation (both follow each other)
    const newConversation = {
      participants: [new ObjectId(currentUserId), new ObjectId(targetUserId)],
      type: 'direct',
      is_request: false,
      created_by: new ObjectId(currentUserId),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('conversations').insertOne(newConversation);
    
    return NextResponse.json({
      success: true,
      conversationId: result.insertedId.toString(),
      isRequest: false,
      message: 'Conversation created successfully'
    });
    
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
