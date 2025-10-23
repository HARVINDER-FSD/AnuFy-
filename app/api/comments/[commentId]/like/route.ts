import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Like or unlike a comment
export async function POST(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params;
    
    // Get token from Authorization header or cookies
    const authHeader = req.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = req.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json({ message: 'You must be logged in to like comments' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if comment exists (check both post and reel comments)
    let comment = await db.collection("comments").findOne({ _id: new ObjectId(commentId) });
    if (!comment) {
      comment = await db.collection("reel_comments").findOne({ _id: new ObjectId(commentId) });
    }
    
    if (!comment) {
      await client.close();
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }
    
    // Check if user already liked the comment
    const existingLike = await db.collection("comment_likes").findOne({
      comment_id: new ObjectId(commentId),
      user_id: new ObjectId(decoded.userId),
    });
    
    if (existingLike) {
      // Unlike
      await db.collection("comment_likes").deleteOne({
        comment_id: new ObjectId(commentId),
        user_id: new ObjectId(decoded.userId),
      });
      
      await client.close();
      return NextResponse.json({ 
        success: true, 
        message: "Comment unliked successfully", 
        liked: false 
      });
    } else {
      // Like
      await db.collection("comment_likes").insertOne({
        comment_id: new ObjectId(commentId),
        user_id: new ObjectId(decoded.userId),
        created_at: new Date(),
      });
      
      await client.close();
      return NextResponse.json({ 
        success: true, 
        message: "Comment liked successfully", 
        liked: true 
      });
    }
  } catch (error: any) {
    console.error("Error in like comment API:", error);
    return NextResponse.json({ 
      message: error.message || "Something went wrong" 
    }, { status: error.status || 500 });
  }
}

// Get like status and count for a comment
export async function GET(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params;
    
    // Get token (optional for viewing)
    const authHeader = req.headers.get('Authorization');
    let token = null;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = req.headers.get('cookie');
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
        // Invalid token, but still allow viewing
      }
    }
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get total like count
    const likeCount = await db.collection("comment_likes")
      .countDocuments({ comment_id: new ObjectId(commentId) });
    
    // Check if current user liked (if logged in)
    let liked = false;
    if (userId) {
      const existingLike = await db.collection("comment_likes").findOne({
        comment_id: new ObjectId(commentId),
        user_id: new ObjectId(userId),
      });
      liked = !!existingLike;
    }
    
    await client.close();
    
    return NextResponse.json({ 
      success: true,
      liked,
      likeCount 
    });
  } catch (error: any) {
    console.error("Error in get comment like status API:", error);
    return NextResponse.json({ 
      message: error.message || "Something went wrong" 
    }, { status: error.status || 500 });
  }
}
