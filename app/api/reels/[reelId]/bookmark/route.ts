import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Bookmark or unbookmark a reel
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
      return NextResponse.json({ message: 'You must be logged in to bookmark reels' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const reel = await db.collection("reels").findOne({ _id: new ObjectId(reelId) });
    if (!reel) {
      await client.close();
      return NextResponse.json({ message: "Reel not found" }, { status: 404 });
    }
    const existingBookmark = await db.collection("reel_bookmarks").findOne({
      reel_id: new ObjectId(reelId),
      user_id: new ObjectId(decoded.userId),
    });
    if (existingBookmark) {
      await db.collection("reel_bookmarks").deleteOne({
        reel_id: new ObjectId(reelId),
        user_id: new ObjectId(decoded.userId),
      });
      await client.close();
      return NextResponse.json({ success: true, message: "Reel unbookmarked successfully", bookmarked: false });
    } else {
      await db.collection("reel_bookmarks").insertOne({
        reel_id: new ObjectId(reelId),
        user_id: new ObjectId(decoded.userId),
        created_at: new Date(),
      });
      await client.close();
      return NextResponse.json({ success: true, message: "Reel bookmarked successfully", bookmarked: true });
    }
  } catch (error: any) {
    console.error("Error in bookmark reel API:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: error.status || 500 });
  }
}

// Get bookmark status for a reel
export async function GET(
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
      return NextResponse.json({ message: 'You must be logged in to check bookmark status' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const existingBookmark = await db.collection("reel_bookmarks").findOne({
      reel_id: new ObjectId(reelId),
      user_id: new ObjectId(decoded.userId),
    });
    await client.close();
    return NextResponse.json({ bookmarked: !!existingBookmark });
  } catch (error: any) {
    console.error("Error in get bookmark status API:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: error.status || 500 });
  }
}
