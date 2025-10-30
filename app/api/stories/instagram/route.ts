import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcm470yhl',
  api_key: process.env.CLOUDINARY_API_KEY || '832377464323471',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'RV8uRIhI2IL5eyl6InvU5s8OX2g',
});


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=')) || parts.find(c => c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'You must be logged in to create a story' }, { status: 401 });
    }
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // Parse form data
    const formData = await request.formData();
    const caption = formData.get('caption') as string || '';
    const mediaFile = formData.get('media') as File | null;
    
    if (!mediaFile) {
      return NextResponse.json({ error: 'Media file is required' }, { status: 400 });
    }
    
    // Connect to database
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      await client.close();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Upload media to Cloudinary
    let mediaUrl = '';
    let mediaType = '';
    
    const arrayBuffer = await mediaFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine media type
    mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
    
    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'stories',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Convert buffer to stream and pipe to uploadStream
      const Readable = require('stream').Readable;
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
    
    // @ts-ignore
    mediaUrl = uploadResult.secure_url;
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Create story document
    const story = {
      user_id: new ObjectId(userId),
      media_url: mediaUrl,
      media_type: mediaType,
      caption: caption || null,
      location: null,
      views_count: 0,
      is_deleted: false,
      created_at: new Date(),
      expires_at: expiresAt
    };
    
    // Insert story into database
    const result = await db.collection('stories').insertOne(story);
    
    await client.close();
    
    return NextResponse.json({
      message: 'Story created successfully',
      story: {
        ...story,
        _id: result.insertedId,
        id: result.insertedId.toString()
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}
