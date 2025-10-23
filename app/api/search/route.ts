import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get search query from URL
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q');
    
    if (!searchQuery) {
      return NextResponse.json(
        { message: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Check authorization (optional for search)
    let userId = null;
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
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (error) {
        // Invalid token, continue without auth
      }
    }
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Search for users (case-insensitive)
    const users = await db.collection('users')
      .find({
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { full_name: { $regex: searchQuery, $options: 'i' } },
          { name: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .limit(10)
      .toArray();
    
    // Get follower counts for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const followersCount = await db.collection('follows')
        .countDocuments({ following_id: user._id });
      
      let isFollowing = false;
      if (userId) {
        const followDoc = await db.collection('follows').findOne({
          follower_id: new ObjectId(userId),
          following_id: user._id
        });
        isFollowing = !!followDoc;
      }
      
      return {
        id: user._id.toString(),
        username: user.username,
        name: user.full_name || user.name || user.username,
        avatar: user.avatar_url || user.avatar || '/placeholder-user.jpg',
        bio: user.bio || '',
        verified: user.is_verified || false,
        followers: followersCount.toString(),
        is_following: isFollowing
      };
    }));
    
    // Search for posts
    const posts = await db.collection('posts')
      .aggregate([
        {
          $match: {
            $or: [
              { caption: { $regex: searchQuery, $options: 'i' } },
              { content: { $regex: searchQuery, $options: 'i' } }
            ]
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $sort: { created_at: -1 } },
        { $limit: 10 }
      ])
      .toArray();
    
    const postsFormatted = posts.map(post => ({
      id: post._id.toString(),
      user: {
        id: post.user._id.toString(),
        username: post.user.username,
        avatar: post.user.avatar_url || post.user.avatar || '/placeholder-user.jpg',
        verified: post.user.is_verified || false
      },
      content: post.caption || post.content || '',
      image: post.media_urls?.[0] || null,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      shares: 0,
      timestamp: 'recently',
      liked: false,
      bookmarked: false
    }));
    
    // Search for hashtags (if you have them)
    const hashtags: any[] = [];
    
    await client.close();
    
    return NextResponse.json({
      users: usersWithStats,
      posts: postsFormatted,
      hashtags: hashtags
    });
    
  } catch (error: any) {
    console.error('Error searching:', error);
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}