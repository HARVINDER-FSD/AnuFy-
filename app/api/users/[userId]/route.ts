import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import * as jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Cache MongoDB connection
let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = await MongoClient.connect(MONGODB_URI);
  return cachedClient;
}

// Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    console.log("Profile request for userId:", userId);
    console.log("Request URL:", request.url);
    
    // Get token from Authorization header or cookies for visitor tracking
    const authHeader = request.headers.get('Authorization');
    let token = null;
    let visitorId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Check for token in cookies as fallback
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=')) || parts.find(c => c.startsWith('client-token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    // Verify token to get visitor ID
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        visitorId = decoded.userId;
      } catch (error) {
        // Invalid token, continue without visitor tracking
      }
    }
    
    // Connect to MongoDB (using cached connection)
    const client = await getMongoClient();
    const db = client.db();
    
    // Find user in MongoDB - check if it's ObjectId or username
    let user = null;
    
    // Check if userId is a valid ObjectId format (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    
    if (isValidObjectId) {
      // Try to find by ObjectId
      user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, password_hash: 0 } }
      );
    }
    
    // If not found by ObjectId or not valid ObjectId, try username
    if (!user) {
      user = await db.collection('users').findOne(
        { username: userId },
        { projection: { password: 0, password_hash: 0 } }
      );
    }
    
    console.log("User lookup result:", user ? "Found" : "Not found");
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Track profile visit if visitor is different from profile owner
    if (visitorId && user && visitorId !== user._id.toString()) {
      try {
        await db.collection('profile_visits').insertOne({
          profile_owner_id: user._id,
          visitor_id: new ObjectId(visitorId),
          visited_at: new Date(),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
        
        // Update visitor count in cache and database
        await db.collection('users').updateOne(
          { _id: user._id },
          { $inc: { profile_visits_count: 1 } }
        );
        
        // Update cache (cache functionality not implemented yet)
        // await VisitorCache.incrementCount(userId);
      } catch (error) {
        console.error('Error tracking profile visit:', error);
        // Continue without failing the request
      }
    }
    
    // Get user's posts count
    const postsCount = await db.collection('posts').countDocuments({
      user_id: user._id,
      is_archived: { $ne: true }
    });
    
    // Get followers and following counts
    const followersCount = await db.collection('follows').countDocuments({
      following_id: user._id
    });
    
    const followingCount = await db.collection('follows').countDocuments({
      follower_id: user._id
    });
    
    // Check if visitor is following this user
    let isFollowing = false;
    let isPending = false;
    if (visitorId && user) {
      try {
        const followRelation = await db.collection('follows').findOne({
          follower_id: new ObjectId(visitorId),
          following_id: user._id
        });
        isFollowing = !!followRelation;
        
        // Check for pending follow request
        if (!isFollowing) {
          const pendingRequest = await db.collection('follow_requests').findOne({
            follower_id: new ObjectId(visitorId),
            following_id: user._id,
            status: 'pending'
          });
          isPending = !!pendingRequest;
        }
      } catch (followError) {
        console.log("Error checking follow status:", followError);
        // Continue without follow status
      }
    }
    
    // Check if user can view content (for private accounts)
    const isPrivate = user.is_private || false;
    const canViewContent = !isPrivate || isFollowing || (visitorId === user._id.toString());
    
    let formattedPosts: any[] = [];
    
    // Only fetch posts if user can view content
    if (canViewContent) {
      const posts = await db.collection('posts')
        .find({
          user_id: user._id,
          is_archived: { $ne: true }
        })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();
      
      // Format posts for frontend
      formattedPosts = posts.map(post => ({
        id: post._id.toString(),
        caption: post.caption || '',
        media_urls: post.media_urls || [],
        media_type: post.media_type || 'text',
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
      }));
    }
    
    // Format user data for frontend
    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      full_name: user.full_name || user.name || '',
      avatar: user.avatar_url || user.avatar || '/placeholder-user.jpg',
      bio: user.bio || '',
      is_verified: user.is_verified || false,
      is_private: isPrivate,
      posts_count: canViewContent ? postsCount : 0,
      followers_count: followersCount,
      following_count: followingCount,
      is_following: isFollowing,
      is_pending: isPending,
      is_own_profile: visitorId === user._id.toString(),
      can_view_content: canViewContent,
      profile_visits_count: user.profile_visits_count || 0,
      posts: formattedPosts
    });
    
  } catch (error: any) {
    console.error('Error fetching user:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const accessToken = authHeader.split(' ')[1];
    const payload = jwt.verify(accessToken, JWT_SECRET) as any;
    
    if (!payload || !payload.userId || payload.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { full_name, bio, website, is_private, avatar_url } = body;
    
    // Connect to MongoDB (using cached connection)
    const client = await getMongoClient();
    const db = client.db();
    
    const updateFields: any = {};
    
    if (full_name !== undefined) {
      updateFields.full_name = full_name;
    }
    
    if (bio !== undefined) {
      updateFields.bio = bio;
    }
    
    if (website !== undefined) {
      updateFields.website = website;
    }
    
    if (is_private !== undefined) {
      updateFields.is_private = is_private;
    }
    
    if (avatar_url !== undefined) {
      updateFields.avatar_url = avatar_url;
    }
    
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }
    
    updateFields.updated_at = new Date();
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateFields },
      { 
        returnDocument: 'after',
        projection: { password: 0, password_hash: 0 }
      }
    );
    
    if (!result) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: result._id.toString(),
      username: result.username,
      full_name: result.full_name,
      avatar_url: result.avatar_url,
      bio: result.bio,
      website: result.website,
      is_verified: result.is_verified || result.verified || false,
      is_private: result.is_private || false,
      created_at: result.created_at
    });
    
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    return NextResponse.json(
      { message },
      { status }
    );
  }
}