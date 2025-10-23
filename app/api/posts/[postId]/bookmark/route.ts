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
      const cookies = req.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json({ message: 'You must be logged in to bookmark posts' }, { status: 401 });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }
    
    // Connect to the database
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if post exists
    const post = await db.collection("posts").findOne({
      _id: new ObjectId(postId),
    });
    
    if (!post) {
      await client.close();
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    
    // Check if user already bookmarked the post
    const existingBookmark = await db.collection("bookmarks").findOne({
      post_id: new ObjectId(postId),
      user_id: new ObjectId(decoded.userId),
    });
    
    if (existingBookmark) {
      // User already bookmarked the post, so remove it
      await db.collection("bookmarks").deleteOne({
        post_id: new ObjectId(postId),
        user_id: new ObjectId(decoded.userId),
      });
      
      await client.close();
      return NextResponse.json({
        success: true,
        message: "Post removed from bookmarks",
        bookmarked: false,
      });
    } else {
      // User hasn't bookmarked the post, so add it
      await db.collection("bookmarks").insertOne({
        post_id: new ObjectId(postId),
        user_id: new ObjectId(decoded.userId),
        created_at: new Date(),
      });
      
      await client.close();
      return NextResponse.json({
        success: true,
        message: "Post bookmarked successfully",
        bookmarked: true,
      });
    }
  } catch (error: any) {
    console.error("Error in bookmark post API:", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: error.status || 500 }
    );
  }
}

// Get bookmark status for a post
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
      const cookies = req.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json({ message: 'You must be logged in to check bookmark status' }, { status: 401 });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }
    
    // Connect to the database
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if user bookmarked the post
    const existingBookmark = await db.collection("bookmarks").findOne({
      post_id: new ObjectId(postId),
      user_id: new ObjectId(decoded.userId),
    });
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      bookmarked: !!existingBookmark,
    });
  } catch (error: any) {
    console.error("Error in get bookmark status API:", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: error.status || 500 }
    );
  }
}