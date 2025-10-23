import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

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
        { message: 'You must be logged in to comment on posts' },
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
    
    // Get request body
    const { content } = await req.json();
    
    if (!content || content.trim() === "") {
      return NextResponse.json(
        { message: "Comment content is required" },
        { status: 400 }
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
    
    // Get user info
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
    });
    
    if (!user) {
      await client.close();
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Create comment
    const comment = {
      post_id: new ObjectId(postId),
      user_id: new ObjectId(decoded.userId),
      content: content.trim(),
      created_at: new Date(),
      username: user.username,
      user_avatar: user.avatar || null,
    };
    
    const result = await db.collection("comments").insertOne(comment);
    
    // Increment comment count in posts collection
    await db.collection("posts").updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { comments_count: 1 } }
    );
    
    // Create notification for post owner (if not commenting on own post)
    if (post.user_id.toString() !== decoded.userId) {
      await db.collection('notifications').insertOne({
        user_id: post.user_id,
        actor_id: new ObjectId(decoded.userId),
        type: 'comment',
        post_id: new ObjectId(postId),
        content: content.trim(),
        is_read: false,
        created_at: new Date()
      });
    }
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      comment: {
        ...comment,
        _id: result.insertedId,
      },
    });
  } catch (error: any) {
    console.error("Error in add comment API:", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: error.status || 500 }
    );
  }
}

// Get comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Get the postId from the URL params
    const { postId } = params;
    
    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get comments for the post
    const comments = await db
      .collection("comments")
      .find({ post_id: new ObjectId(postId) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total comment count
    const commentCount = await db
      .collection("comments")
      .countDocuments({ post_id: new ObjectId(postId) });
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      comments,
      commentCount,
      hasMore: skip + limit < commentCount,
    });
  } catch (error: any) {
    console.error("Error in get comments API:", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: error.status || 500 }
    );
  }
}