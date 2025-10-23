import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Get user settings

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
        const tokenCookie = parts.find(c => c.startsWith('token=')) || parts.find(c => c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to view settings' },
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
    
    // Get user settings
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { settings: 1 } }
    );
    
    await client.close();
    
    // Return default settings if none exist
    const defaultSettings = {
      darkMode: true,
      privateAccount: false,
      showOnlineStatus: true,
      allowTagging: true,
      allowMentions: true,
      showReadReceipts: true,
      whoCanMessage: 'everyone',
      whoCanSeeStories: 'everyone',
      whoCanSeeFollowers: 'everyone',
      pushNotifications: true,
      emailNotifications: false,
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      directMessages: true,
      liveVideos: false,
      stories: true,
      posts: true,
      marketing: false,
      security: true
    };
    
    const settings = user?.settings || defaultSettings;
    
    return NextResponse.json({ settings });
    
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user settings
export async function PATCH(request: NextRequest) {
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
        const tokenCookie = parts.find(c => c.startsWith('token=')) || parts.find(c => c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to update settings' },
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
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get current user settings
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { settings: 1 } }
    );
    
    const currentSettings = user?.settings || {};
    const updatedSettings = { ...currentSettings, ...body };
    
    // Update user settings
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          settings: updatedSettings,
          updated_at: new Date()
        } 
      }
    );
    
    await client.close();
    
    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings,
      message: 'Settings updated successfully' 
    });
    
  } catch (error: any) {
    console.error('Error updating settings:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}