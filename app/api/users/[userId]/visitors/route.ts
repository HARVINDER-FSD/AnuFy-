import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Get profile visitors
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Check for token in cookies as fallback
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to view profile visitors' },
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
    
    // Only the profile owner can view their visitors
    if (decoded.userId !== userId) {
      return NextResponse.json(
        { message: 'You can only view your own profile visitors' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = parseInt(url.searchParams.get('skip') || '0');
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get profile visitors with user information
    const visitors = await db.collection('profile_visits')
      .aggregate([
        {
          $match: {
            profile_owner_id: new MongoClient.ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'visitor_id',
            foreignField: '_id',
            as: 'visitor'
          }
        },
        {
          $unwind: '$visitor'
        },
        {
          $project: {
            _id: 1,
            visitor_id: 1,
            visited_at: 1,
            'visitor.username': 1,
            'visitor.avatar': 1,
            'visitor.full_name': 1,
            'visitor.is_verified': 1
          }
        },
        {
          $sort: { visited_at: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ])
      .toArray();
    
    // Get total visitor count
    const totalVisitors = await db.collection('profile_visits').countDocuments({
      profile_owner_id: new MongoClient.ObjectId(userId)
    });
    
    await client.close();
    
    // Transform the data to match expected format
    const transformedVisitors = visitors.map(visit => ({
      id: visit._id.toString(),
      visitor: {
        id: visit.visitor_id.toString(),
        username: visit.visitor.username,
        full_name: visit.visitor.full_name,
        avatar: visit.visitor.avatar || '/placeholder-user.jpg',
        is_verified: visit.visitor.is_verified || false
      },
      visited_at: visit.visited_at
    }));
    
    return NextResponse.json({
      visitors: transformedVisitors,
      totalVisitors,
      hasMore: skip + limit < totalVisitors
    });
    
  } catch (error: any) {
    console.error('Error fetching profile visitors:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
