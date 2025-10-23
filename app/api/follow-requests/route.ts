import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Get all follow requests for the current user
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
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
        { message: 'You must be logged in' },
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
    
    // Get all follow requests
    const requests = await db.collection('follow_requests')
      .aggregate([
        { $match: { following_id: new ObjectId(userId), status: 'pending' } },
        {
          $lookup: {
            from: 'users',
            localField: 'follower_id',
            foreignField: '_id',
            as: 'follower'
          }
        },
        { $unwind: '$follower' },
        { $sort: { created_at: -1 } }
      ])
      .toArray();
    
    await client.close();
    
    const formattedRequests = requests.map(req => ({
      id: req._id.toString(),
      user: {
        id: req.follower._id.toString(),
        username: req.follower.username,
        full_name: req.follower.full_name || req.follower.name || '',
        avatar: req.follower.avatar_url || req.follower.avatar || '/placeholder-user.jpg',
        is_verified: req.follower.is_verified || false
      },
      created_at: req.created_at
    }));
    
    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      count: formattedRequests.length
    });
    
  } catch (error: any) {
    console.error('Error fetching follow requests:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
