import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';

export const dynamic = 'force-dynamic';

// Cache MongoDB connection
let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = await MongoClient.connect(MONGODB_URI);
  return cachedClient;
}

// Search users by username or name
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
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    const userId = decoded.userId;
    
    // Get search query
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        users: [],
        message: 'Search query must be at least 2 characters'
      });
    }
    
    // Connect to MongoDB (using cached connection)
    const client = await getMongoClient();
    const db = client.db();
    
    // Ensure indexes exist for faster search (non-blocking, only creates if not exists)
    db.collection('users').createIndex({ username: 1 }).catch(() => {});
    db.collection('users').createIndex({ full_name: 1 }).catch(() => {});
    db.collection('users').createIndex({ name: 1 }).catch(() => {});
    
    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Use case-insensitive search (works without indexes)
    const searchRegex = new RegExp(escapedQuery, 'i');
    
    // Search users by username or full_name (case-insensitive)
    const users = await db.collection('users')
      .find({
        _id: { $ne: new ObjectId(userId) }, // Exclude current user
        $or: [
          { username: searchRegex },
          { full_name: searchRegex },
          { name: searchRegex }
        ]
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
      .limit(limit)
      .toArray();
    
    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      full_name: user.full_name || user.name || user.username,
      avatar: user.avatar_url || user.avatar || '/placeholder-user.jpg',
      is_verified: user.is_verified || false,
      is_private: user.is_private || false
    }));
    
    return NextResponse.json({
      users: formattedUsers,
      count: formattedUsers.length
    });
    
  } catch (error: any) {
    console.error('Error searching users:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
