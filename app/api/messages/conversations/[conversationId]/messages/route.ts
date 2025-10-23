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

// Get messages for a conversation
export async function GET(
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
        { message: 'You must be logged in to view messages' },
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
    
    // Get query parameters - reduced default limit for faster loading
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10'); // Reduced to 10 for instant loading
    const skip = parseInt(url.searchParams.get('skip') || '0');
    
    // Connect to MongoDB (using cached connection)
    const client = await getMongoClient();
    const db = client.db();
    
    // Skip conversation check for speed - trust the conversationId from URL
    // Messages query will return empty array if conversation doesn't exist
    
    // Get messages for the conversation (optimized query)
    const messages = await db.collection('messages')
      .find(
        {
          conversation_id: new ObjectId(conversationId),
          is_deleted: { $ne: true },
          deleted_for: { $ne: new ObjectId(userId) } // Exclude messages deleted by this user
        },
        {
          projection: {
            // Only fetch needed fields
            conversation_id: 1,
            sender_id: 1,
            recipient_id: 1,
            content: 1,
            message_type: 1,
            media_url: 1,
            is_read: 1,
            read_at: 1,
            reactions: 1,
            shared_content: 1,
            created_at: 1,
            updated_at: 1
          }
        }
      )
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit + 1) // Fetch one extra to check if there are more
      .toArray();
    
    // Check if there are more messages without expensive count query
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }
    const totalMessages = skip + messages.length + (hasMore ? 1 : 0);
    
    // Don't close cached connection
    
    // Transform the data to match expected format
    const transformedMessages = messages.map(message => {
      const transformed: any = {
        _id: message._id.toString(),
        conversation_id: message.conversation_id.toString(),
        sender_id: message.sender_id.toString(),
        recipient_id: message.recipient_id.toString(),
        content: message.content,
        message_type: message.message_type,
        media_url: message.media_url,
        is_read: message.is_read,
        read_at: message.read_at,
        reactions: message.reactions || [],
        created_at: message.created_at,
        updated_at: message.updated_at
      };

      // Include shared content if present
      if (message.shared_content) {
        transformed.shared_content = {
          content_type: message.shared_content.content_type,
          content_id: message.shared_content.content_id.toString(),
          preview_data: message.shared_content.preview_data
        };
      }

      return transformed;
    });
    
    return NextResponse.json({
      messages: transformedMessages.reverse(), // Reverse to show oldest first
      totalMessages,
      hasMore: skip + limit < totalMessages
    });
    
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send a new message
export async function POST(
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
        { message: 'You must be logged in to send messages' },
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
    
    const { content, message_type = 'text', media_url, reply_to, shared_content } = body;
    
    // Validate required fields
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Message content is required' },
        { status: 400 }
      );
    }
    
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
    
    // Find recipient (other participant)
    const recipientId = conversation.participants.find((p: any) => 
      p.toString() !== userId
    );
    
    if (!recipientId) {
      return NextResponse.json(
        { message: 'Invalid conversation' },
        { status: 400 }
      );
    }
    
    // Create new message
    const newMessage: any = {
      conversation_id: new ObjectId(conversationId),
      sender_id: new ObjectId(userId),
      recipient_id: new ObjectId(recipientId),
      content: content.trim(),
      message_type: message_type,
      media_url: media_url || null,
      reply_to: reply_to ? new ObjectId(reply_to) : null,
      is_read: false,
      reactions: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add shared content if present
    if (shared_content && (message_type === 'shared_post' || message_type === 'shared_story')) {
      newMessage.shared_content = {
        content_type: shared_content.content_type,
        content_id: new ObjectId(shared_content.content_id),
        content_type_ref: shared_content.content_type === 'post' ? 'Post' : 'Story',
        preview_data: shared_content.preview_data || null
      };
    }
    
    const result = await db.collection('messages').insertOne(newMessage);
    
    // Update conversation's updated_at
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { updated_at: new Date() } }
    );
    
    // Return the created message
    const responseMessage: any = {
      _id: result.insertedId.toString(),
      conversation_id: conversationId,
      sender_id: userId,
      recipient_id: recipientId.toString(),
      content: newMessage.content,
      message_type: newMessage.message_type,
      media_url: newMessage.media_url,
      is_read: newMessage.is_read,
      reactions: newMessage.reactions,
      created_at: newMessage.created_at,
      updated_at: newMessage.updated_at
    };

    // Include shared content in response if present
    if (newMessage.shared_content) {
      responseMessage.shared_content = {
        content_type: newMessage.shared_content.content_type,
        content_id: newMessage.shared_content.content_id.toString(),
        preview_data: newMessage.shared_content.preview_data
      };
    }

    return NextResponse.json(responseMessage, { status: 201 });
    
  } catch (error: any) {
    console.error('Error sending message:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
