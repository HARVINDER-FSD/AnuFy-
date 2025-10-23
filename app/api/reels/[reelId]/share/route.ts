import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Record a share for a reel
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
      return NextResponse.json({ message: 'You must be logged in to share reels' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
    }
    const { platform, message } = await req.json();
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const reel = await db.collection("reels").findOne({ _id: new ObjectId(reelId) });
    if (!reel) {
      await client.close();
      return NextResponse.json({ message: "Reel not found" }, { status: 404 });
    }
    const shareRecord = {
      reel_id: new ObjectId(reelId),
      user_id: new ObjectId(decoded.userId),
      platform: platform || 'internal',
      message: message || '',
      shared_at: new Date(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    };
    await db.collection("reel_shares").insertOne(shareRecord);
    await db.collection("reels").updateOne(
      { _id: new ObjectId(reelId) },
      { $inc: { shares_count: 1 } }
    );
    await client.close();
    return NextResponse.json({
      success: true,
      message: "Reel shared successfully",
      share_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reels/${reelId}`
    });
  } catch (error: any) {
    console.error("Error in share reel API:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: error.status || 500 });
  }
}
