import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Add a comment to a reel
export async function POST(
  req: NextRequest,
  { params }: { params: { reelId: string } }
) {
  try {
    const { reelId } = params;
    const authHeader = req.headers.get('Authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = req.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    if (!token) {
      return NextResponse.json({ message: 'You must be logged in to comment on reels' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }
    const { content } = await req.json();
    if (!content || content.trim() === "") {
      return NextResponse.json({ message: "Comment content is required" }, { status: 400 });
    }
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const reel = await db.collection("reels").findOne({ _id: new ObjectId(reelId) });
    if (!reel) {
      await client.close();
      return NextResponse.json({ message: "Reel not found" }, { status: 404 });
    }
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      await client.close();
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const comment = {
      reel_id: new ObjectId(reelId),
      user_id: new ObjectId(decoded.userId),
      content: content.trim(),
      created_at: new Date(),
      username: user.username,
      user_avatar: user.avatar || null,
    };
    const result = await db.collection("reel_comments").insertOne(comment);
    await db.collection("reels").updateOne(
      { _id: new ObjectId(reelId) },
      { $inc: { comments_count: 1 } }
    );
    await client.close();
    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      comment: { ...comment, _id: result.insertedId },
    });
  } catch (error: any) {
    console.error("Error in add comment API:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: error.status || 500 });
  }
}

// Get comments for a reel
export async function GET(
  req: NextRequest,
  { params }: { params: { reelId: string } }
) {
  try {
    const { reelId } = params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    const comments = await db.collection("reel_comments")
      .find({ reel_id: new ObjectId(reelId) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    await client.close();
    
    return NextResponse.json({
      comments: comments.map(comment => ({
        ...comment,
        _id: comment._id.toString(),
        reel_id: comment.reel_id.toString(),
        user_id: comment.user_id.toString(),
      }))
    });
  } catch (error: any) {
    console.error("Error in get comments API:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: error.status || 500 });
  }
}
