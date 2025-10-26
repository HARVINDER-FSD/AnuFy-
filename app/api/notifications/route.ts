import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/models/notification';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

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
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const unreadOnly = searchParams.get('unread') === 'true';
    
    // Build query
    const query: any = { recipient_id: new mongoose.Types.ObjectId(userId) };
    if (unreadOnly) {
      query.is_read = false;
    }
    
    // Get notifications with sender info
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get sender details
    const senderIds = notifications.map(n => n.sender_id);
    const senders = await User.find({ _id: { $in: senderIds } })
      .select('username full_name avatar_url is_verified')
      .lean();
    
    const senderMap = new Map(senders.map(s => [s._id.toString(), s]));
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient_id: new mongoose.Types.ObjectId(userId),
      is_read: false
    });
    
    const total = await Notification.countDocuments(query);
    
    // Format notifications
    const formattedNotifications = notifications.map(n => {
      const sender = senderMap.get(n.sender_id.toString());
      return {
        id: n._id.toString(),
        type: n.type,
        message: n.message || '',
        content_id: n.content_id?.toString() || null,
        content_type: n.content_type || null,
        is_read: n.is_read,
        created_at: n.created_at,
        sender: {
          id: sender?._id?.toString() || '',
          username: sender?.username || 'Unknown',
          full_name: sender?.full_name || '',
          avatar_url: sender?.avatar_url || '/placeholder-user.jpg',
          is_verified: sender?.is_verified || false
        }
      };
    });
    
    return NextResponse.json({ 
      notifications: formattedNotifications,
      unread_count: unreadCount,
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
    
    await connectToDatabase();
    
    const body = await request.json();
    const { notificationId } = body;
    
    if (notificationId) {
      // Mark specific notification as read
      await Notification.updateOne(
        { 
          _id: new mongoose.Types.ObjectId(notificationId),
          recipient_id: new mongoose.Types.ObjectId(userId)
        },
        { $set: { is_read: true } }
      );
    } else {
      // Mark all notifications as read
      await Notification.updateMany(
        { recipient_id: new mongoose.Types.ObjectId(userId) },
        { $set: { is_read: true } }
      );
    }
    
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