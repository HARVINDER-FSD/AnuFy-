import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Get token from Authorization header or cookies
    const authHeader = req.headers.get('authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.get('token')?.value || req.cookies.get('client-token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );
    }

    // Verify JWT
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // Connect to MongoDB using shared connection
    const { db } = await connectToDatabase();

    let user;

    // Try to find by ObjectId first
    if (ObjectId.isValid(userId)) {
      user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    }

    // If not found, try by username
    if (!user) {
      user = await db.collection('users').findOne({ username: userId });
    }

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if this is the user's own profile
    const isOwnProfile = decoded.userId === user._id.toString();

    // Get avatar value
    const avatarValue = user.avatar || user.avatar_url || '/placeholder-user.jpg';

    // Fetch user's posts from MongoDB - try both string and ObjectId
    const userIdString = user._id.toString();
    const posts = await db.collection('posts')
      .find({
        $or: [
          { user_id: userIdString },
          { user_id: user._id }
        ]
      })
      .sort({ created_at: -1 })
      .toArray();

    // Get actual post count
    const actualPostCount = posts.length;

    // Check if current user follows this user
    let isFollowing = false;
    if (!isOwnProfile) {
      const followRecord = await db.collection('follows').findOne({
        follower_id: decoded.userId,
        following_id: user._id.toString()
      });
      isFollowing = !!followRecord;
    }

    // Format posts for response
    const formattedPosts = posts.map(post => ({
      id: post._id.toString(),
      user_id: user._id.toString(),
      username: user.username,
      user_avatar: avatarValue,
      caption: post.caption || post.content || '',
      content: post.caption || post.content || '',
      media_urls: post.media_urls || (post.image ? [post.image] : []),
      image: post.image || (post.media_urls && post.media_urls[0]) || null,
      video: post.video || null,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      created_at: post.created_at,
      timestamp: post.created_at,
      is_liked: false, // TODO: Check if current user liked this post
      is_bookmarked: false, // TODO: Check if current user bookmarked this post
      is_verified: user.is_verified || false
    }));

    // Return user data with cache-busting timestamp
    const timestamp = Date.now();

    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      full_name: user.full_name || user.name || '',
      name: user.full_name || user.name || '',
      bio: user.bio || '',
      avatar: avatarValue.includes('?') ? `${avatarValue}&t=${timestamp}` : `${avatarValue}?t=${timestamp}`,
      avatar_url: avatarValue.includes('?') ? `${avatarValue}&t=${timestamp}` : `${avatarValue}?t=${timestamp}`,
      followers_count: user.followers_count || user.followers || 0,
      following_count: user.following_count || user.following || 0,
      is_verified: user.is_verified || user.verified || false,
      posts_count: actualPostCount,
      website: user.website || '',
      location: user.location || '',
      is_private: user.is_private || false,
      is_own_profile: isOwnProfile,
      is_following: isFollowing,
      posts: formattedPosts
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { message: "Failed to get user profile", error: error.message },
      { status: 500 }
    );
  }
}
