import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    let userId: string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Connect to database using shared connection
    const { db } = await connectToDatabase();

    console.log('[Feed API] Fetching posts for user:', userId);

    // Get posts with user data (exclude archived posts)
    const posts = await db.collection('posts').aggregate([
      { $match: { is_archived: { $ne: true } } }, // Filter out deleted posts
      { $sort: { created_at: -1 } },
      { $limit: limit + skip },
      { $skip: skip },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          caption: 1,
          media_urls: 1,
          media_type: 1,
          location: 1,
          created_at: 1,
          updated_at: 1,
          likes_count: 1,
          comments_count: 1,
          user: {
            _id: 1,
            username: 1,
            full_name: 1,
            avatar_url: 1,
            is_verified: 1
          }
        }
      }
    ]).toArray();

    // Get likes for current user to determine liked status
    const userLikes = await db.collection('likes')
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    const likedPostIds = new Set(userLikes.map(like => like.post_id.toString()));
    console.log('[Feed API] User has liked', likedPostIds.size, 'posts');

    // Format posts for frontend
    const formattedPosts = posts.map(post => {
      const postId = post._id.toString();
      const isLiked = likedPostIds.has(postId);

      return {
        id: postId,
        content: post.caption || '',
        media_urls: post.media_urls || [],
        media_type: post.media_type || 'text',
        location: post.location,
        created_at: post.created_at,
        updated_at: post.updated_at,
        likes: post.likes_count || 0,
        likes_count: post.likes_count || 0,
        comments: post.comments_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: 0,
        liked: isLiked,
        is_liked: isLiked,
        bookmarked: false,
        user: {
          id: post.user._id.toString(),
          username: post.user.username,
          full_name: post.user.full_name,
          avatar: post.user.avatar_url,
          avatar_url: post.user.avatar_url,
          verified: post.user.is_verified || false,
          is_verified: post.user.is_verified || false
        }
      };
    });

    return NextResponse.json({
      posts: formattedPosts,
      hasMore: posts.length === limit
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}