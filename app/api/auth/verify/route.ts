import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }
    
    // Connect to MongoDB and get user data
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
    
    if (!user) {
      await client.close();
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    await client.close();
    
    // Return user data without password
    const { password, ...userData } = user;
    
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name || "",
        bio: user.bio || "",
        avatar: user.avatar || "/placeholder-user.jpg",
        followers: user.followers || 0,
        following: user.following || 0,
        verified: user.verified || false,
        posts_count: user.posts_count || 0
      }
    });
  } catch (error: any) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { message: "Token verification failed" },
      { status: 401 }
    );
  }
}
