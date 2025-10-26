import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BlockedUser from '@/models/blocked-user';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

// Block/Unblock a user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const targetUserId = params.userId;
    
    // Get token
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
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUserId = decoded.userId;
    
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { message: 'You cannot block yourself' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if already blocked
    const existingBlock = await BlockedUser.findOne({
      blocker_id: new mongoose.Types.ObjectId(currentUserId),
      blocked_id: new mongoose.Types.ObjectId(targetUserId)
    });
    
    if (existingBlock) {
      // Unblock
      await BlockedUser.deleteOne({ _id: existingBlock._id });
      
      return NextResponse.json({
        blocked: false,
        message: 'User unblocked successfully'
      });
    } else {
      // Block
      await BlockedUser.create({
        blocker_id: new mongoose.Types.ObjectId(currentUserId),
        blocked_id: new mongoose.Types.ObjectId(targetUserId)
      });
      
      // Also remove any follow relationships
      const { db } = await connectToDatabase();
      await db.collection('follows').deleteMany({
        $or: [
          {
            follower_id: new mongoose.Types.ObjectId(currentUserId),
            following_id: new mongoose.Types.ObjectId(targetUserId)
          },
          {
            follower_id: new mongoose.Types.ObjectId(targetUserId),
            following_id: new mongoose.Types.ObjectId(currentUserId)
          }
        ]
      });
      
      return NextResponse.json({
        blocked: true,
        message: 'User blocked successfully'
      });
    }
    
  } catch (error: any) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get blocked users list
export async function GET(request: NextRequest) {
  try {
    // Get token
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
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    
    await connectToDatabase();
    
    // Get blocked users
    const blockedUsers = await BlockedUser.find({
      blocker_id: new mongoose.Types.ObjectId(userId)
    })
    .populate('blocked_id', 'username full_name avatar_url')
    .lean();
    
    return NextResponse.json({
      blocked_users: blockedUsers.map(b => ({
        id: b.blocked_id,
        blocked_at: b.created_at
      }))
    });
    
  } catch (error: any) {
    console.error('Error fetching blocked users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
