import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

// Upload media (image/video) in message
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    
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
        { message: 'You must be logged in to send media' },
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
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageType = formData.get('message_type') as string;
    const content = formData.get('content') as string || '';
    const replyTo = formData.get('reply_to') as string;
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    
    // Create media URL
    const mediaUrl = `/uploads/messages/${filename}`;
    
    // Connect to MongoDB
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
    
    // Find recipient
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
      message_type: messageType,
      media_url: mediaUrl,
      reply_to: replyTo ? new ObjectId(replyTo) : null,
      is_read: false,
      reactions: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('messages').insertOne(newMessage);
    
    // Update conversation's updated_at
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { updated_at: new Date() } }
    );
    
    // Return the created message
    return NextResponse.json({
      message: {
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
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error uploading media:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
