import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Reply to a comment
export async function POST(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params;
    
    // Get token
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
      return NextResponse.json({ message: 'You must be logged in to reply to comments' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }
    
    const { content } = await req.json();
    if (!content || content.trim() === "") {
      return NextResponse.json({ message: "Reply content is required" }, { status: 400 });
    }
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Find parent comment (check both collections)
    let parentComment = await db.collection("comments").findOne({ _id: new ObjectId(commentId) });
    let collectionName = "comments";
    
    if (!parentComment) {
      parentComment = await db.collection("reel_comments").findOne({ _id: new ObjectId(commentId) });
      collectionName = "reel_comments";
    }
    
    if (!parentComment) {
      await client.close();
      return NextResponse.json({ message: "Parent comment not found" }, { status: 404 });
    }
    
    // Get user info
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      await client.close();
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    // Create reply
    const reply = {
      post_id: parentComment.post_id || null,
      reel_id: parentComment.reel_id || null,
      user_id: new ObjectId(decoded.userId),
      content: content.trim(),
      parent_comment_id: new ObjectId(commentId),
      created_at: new Date(),
      username: user.username,
      user_avatar: user.avatar_url || user.avatar || null,
    };
    
    const result = await db.collection(collectionName).insertOne(reply);
    
    // Increment comment count on the post/reel
    if (parentComment.post_id) {
      await db.collection("posts").updateOne(
        { _id: parentComment.post_id },
        { $inc: { comments_count: 1 } }
      );
    } else if (parentComment.reel_id) {
      await db.collection("reels").updateOne(
        { _id: parentComment.reel_id },
        { $inc: { comments_count: 1 } }
      );
    }
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: "Reply added successfully",
      reply: { 
        ...reply, 
        _id: result.insertedId.toString(),
        user_id: reply.user_id.toString(),
        parent_comment_id: reply.parent_comment_id.toString(),
        post_id: reply.post_id?.toString() || null,
        reel_id: reply.reel_id?.toString() || null,
      },
    });
  } catch (error: any) {
    console.error("Error in reply to comment API:", error);
    return NextResponse.json({ 
      message: error.message || "Something went wrong" 
    }, { status: error.status || 500 });
  }
}

// Get replies for a comment
export async function GET(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Get replies from both collections
    const postReplies = await db.collection("comments")
      .find({ parent_comment_id: new ObjectId(commentId) })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const reelReplies = await db.collection("reel_comments")
      .find({ parent_comment_id: new ObjectId(commentId) })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const replies = [...postReplies, ...reelReplies].sort((a, b) => 
      a.created_at.getTime() - b.created_at.getTime()
    );
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      replies: replies.map(reply => ({
        ...reply,
        _id: reply._id.toString(),
        user_id: reply.user_id.toString(),
        parent_comment_id: reply.parent_comment_id.toString(),
        post_id: reply.post_id?.toString() || null,
        reel_id: reply.reel_id?.toString() || null,
      }))
    });
  } catch (error: any) {
    console.error("Error in get replies API:", error);
    return NextResponse.json({ 
      message: error.message || "Something went wrong" 
    }, { status: error.status || 500 });
  }
}
