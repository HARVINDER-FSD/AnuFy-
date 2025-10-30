import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse form data
    const formData = await request.formData();
    const content = formData.get('content') as string || '';
    const mediaFile = formData.get('media') as File | null;
    const location = formData.get('location') as string || '';
    
    // Connect to database using shared connection
    const { db } = await connectToDatabase();
    
    // Check if user exists
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Upload media to Cloudinary if provided
    let mediaUrl = '';
    let mediaType = '';
    
    if (mediaFile) {
      const arrayBuffer = await mediaFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Determine media type
      mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
      
      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'posts',
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
    }
    
    // Create post document
    const post = {
      user_id: new ObjectId(userId),
      caption: content,
      media_urls: mediaUrl ? [mediaUrl] : [],
      media_type: mediaType || 'text',
      location,
      likes_count: 0,
      comments_count: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Insert post into database
    const result = await db.collection('posts').insertOne(post);
    
    // Update user's post count
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { posts_count: 1 } }
    );
    
    return NextResponse.json({
      message: 'Post created successfully',
      post: {
        ...post,
        _id: result.insertedId
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
