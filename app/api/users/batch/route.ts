import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = await MongoClient.connect(MONGODB_URI);
  return cachedClient;
}

// Batch fetch multiple users by IDs
export async function POST(request: NextRequest) {
  try {
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
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { userIds } = body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { message: 'userIds array is required' },
        { status: 400 }
      );
    }
    
    // Limit to 50 users per request
    const limitedIds = userIds.slice(0, 50);
    
    const client = await getMongoClient();
    const db = client.db();
    
    // Fetch all users in one query
    const users = await db.collection('users')
      .find({
        _id: { $in: limitedIds.map(id => new ObjectId(id)) }
      })
      .project({
        _id: 1,
        username: 1,
        full_name: 1,
        name: 1,
        avatar_url: 1,
        avatar: 1,
        is_verified: 1,
        is_private: 1
      })
      .toArray();
    
    // Format users as a map for easy lookup
    const usersMap: { [key: string]: any } = {};
    users.forEach(user => {
      usersMap[user._id.toString()] = {
        id: user._id.toString(),
        username: user.username,
        full_name: user.full_name || user.name || user.username,
        avatar: user.avatar_url || user.avatar || '/placeholder-user.jpg',
        is_verified: user.is_verified || false,
        is_private: user.is_private || false
      };
    });
    
    return NextResponse.json({ users: usersMap });
    
  } catch (error: any) {
    console.error('Error fetching batch users:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
