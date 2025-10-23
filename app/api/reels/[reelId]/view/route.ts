import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Record a view for a reel
export async function POST(
  req: NextRequest,
  { params }: { params: { reelId: string } }
) {
  try {
    const { reelId } = params;
    const authHeader = req.headers.get('Authorization');
    let token = null;
    let userId = null;
    
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
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (error) {
        // Invalid token, continue without user tracking
      }
    }
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if reel exists
    const reel = await db.collection("reels").findOne({ _id: new MongoClient.ObjectId(reelId) });
    if (!reel) {
      await client.close();
      return NextResponse.json({ message: "Reel not found" }, { status: 404 });
    }
    
    // Increment view count
    await db.collection("reels").updateOne(
      { _id: new MongoClient.ObjectId(reelId) },
      { $inc: { views_count: 1 } }
    );
    
    // Record view for analytics (optional, for user-specific tracking)
    if (userId) {
      await db.collection("reel_views").insertOne({
        reel_id: new MongoClient.ObjectId(reelId),
        user_id: new MongoClient.ObjectId(userId),
        viewed_at: new Date(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });
    }
    
    await client.close();
    
    return NextResponse.json({ success: true, message: "View recorded successfully" });
  } catch (error: any) {
    console.error("Error in record view API:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: error.status || 500 });
  }
}
