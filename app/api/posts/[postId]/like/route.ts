import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { PostStatsCache, CacheInvalidation } from '@/lib/cache-utils';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Get the postId from the URL params
    const { postId } = params;
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Check for token in cookies as fallback
      const cookies = req.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to like posts' },
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
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if post exists
    const post = await db.collection("posts").findOne({
      _id: new ObjectId(postId),
    });
    
    if (!post) {
      await client.close();
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }
    
    // Check if user already liked the post
    const existingLike = await db.collection("likes").findOne({
      post_id: new ObjectId(postId),
      user_id: new ObjectId(decoded.userId),
    });
    
    if (existingLike) {
      // User already liked the post, so unlike it
      await db.collection("likes").deleteOne({
        post_id: new ObjectId(postId),
        user_id: new ObjectId(decoded.userId),
      });
      
      // Decrement like count in posts collection
      await db.collection("posts").updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { likes_count: -1 } }
      );
      
      await client.close();
      
      // Update cache
      await CacheInvalidation.onPostLike(postId, decoded.userId);
      
      return NextResponse.json({
        success: true,
        message: "Post unliked successfully",
        liked: false,
      });
    } else {
      // User hasn't liked the post, so like it
      await db.collection("likes").insertOne({
        post_id: new ObjectId(postId),
        user_id: new ObjectId(decoded.userId),
        created_at: new Date(),
      });
      
      // Increment like count in posts collection
      await db.collection("posts").updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { likes_count: 1 } }
      );
      
      // Create notification for post owner (if not liking own post)
      if (post.user_id.toString() !== decoded.userId) {
        await db.collection('notifications').insertOne({
          user_id: post.user_id,
          actor_id: new ObjectId(decoded.userId),
          type: 'like',
          post_id: new ObjectId(postId),
          content: 'liked your post',
          is_read: false,
          created_at: new Date()
        });
      }
      
      await client.close();
      
      // Update cache
      await CacheInvalidation.onPostLike(postId, decoded.userId);
      
      return NextResponse.json({
        success: true,
        message: "Post liked successfully",
        liked: true,
      });
    }
  } catch (error: any) {
    console.error("Error in like post API:", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: error.status || 500 }
    );
  }
}

// Get like status for a post
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Get the postId from the URL params
    const { postId } = params;
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Check for token in cookies as fallback
      const cookies = req.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to view like status' },
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
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if user liked the post
    const existingLike = await db.collection("likes").findOne({
      post_id: new ObjectId(postId),
      user_id: new ObjectId(decoded.userId),
    });
    
    // Get total like count
    const likeCount = await db.collection("likes").countDocuments({
      post_id: new ObjectId(postId),
    });
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      liked: !!existingLike,
      likeCount,
    });
  } catch (error: any) {
    console.error("Error in get like status API:", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: error.status || 500 }
    );
  }
}