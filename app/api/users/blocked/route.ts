import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BlockedUser from '@/models/blocked-user';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

// Get current user's blocked users list
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
    
    // Get blocked users with their info
    const blockedUsers = await BlockedUser.find({
      blocker_id: new mongoose.Types.ObjectId(userId)
    }).lean();
    
    // Get user details
    const blockedUserIds = blockedUsers.map(b => b.blocked_id);
    const users = await User.find({
      _id: { $in: blockedUserIds }
    })
    .select('username full_name avatar_url')
    .lean();
    
    // Map users with blocked_at timestamp
    const usersMap = new Map(users.map(u => [u._id.toString(), u]));
    const blockedUsersWithInfo = blockedUsers.map(b => {
      const user = usersMap.get(b.blocked_id.toString());
      return {
        id: b.blocked_id.toString(),
        username: user?.username || 'Unknown',
        full_name: user?.full_name || '',
        avatar_url: user?.avatar_url || '/placeholder.svg',
        blocked_at: b.created_at
      };
    });
    
    return NextResponse.json({
      blocked_users: blockedUsersWithInfo
    });
    
  } catch (error: any) {
    console.error('Error fetching blocked users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
