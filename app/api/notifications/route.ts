import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Get user notifications
export async function GET(request: Request) {
  try {
    // Check authorization header first
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in to view notifications' },
        { status: 401 }
      );
    }
    
    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get notifications for the user
    const notifications = await db.collection('notifications')
      .aggregate([
        { $match: { user_id: new ObjectId(userId) } },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'actor_id',
            foreignField: '_id',
            as: 'actor'
          }
        },
        { $unwind: { path: '$actor', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'posts',
            localField: 'post_id',
            foreignField: '_id',
            as: 'post'
          }
        },
        { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } }
      ])
      .toArray();
    
    const total = await db.collection('notifications')
      .countDocuments({ user_id: new ObjectId(userId) });
    
    await client.close();
    
    // Format the response
    const formattedNotifications = notifications.map(n => ({
      id: n._id.toString(),
      type: n.type,
      content: n.content || '',
      post_id: n.post_id?.toString() || null,
      post_image: n.post?.media_urls?.[0] || null,
      is_read: n.is_read || false,
      created_at: n.created_at,
      user: {
        id: n.actor?._id?.toString() || '',
        username: n.actor?.username || 'Unknown',
        full_name: n.actor?.full_name || n.actor?.name || '',
        avatar_url: n.actor?.avatar_url || n.actor?.avatar || '/placeholder-user.jpg',
        is_verified: n.actor?.is_verified || false
      }
    }));
    
    return NextResponse.json({ 
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PUT(request: Request) {
  try {
    // Check authorization
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in to mark notifications as read' },
        { status: 401 }
      );
    }
    
    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { notificationId } = body;
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    if (notificationId) {
      // Mark specific notification as read
      await db.collection('notifications').updateOne(
        { 
          _id: new ObjectId(notificationId),
          user_id: new ObjectId(userId)
        },
        { $set: { is_read: true } }
      );
    } else {
      // Mark all notifications as read
      await db.collection('notifications').updateMany(
        { user_id: new ObjectId(userId) },
        { $set: { is_read: true } }
      );
    }
    
    await client.close();
    
    return NextResponse.json({ 
      success: true,
      message: notificationId ? 'Notification marked as read' : 'All notifications marked as read'
    });
    
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}