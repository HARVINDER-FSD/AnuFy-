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
    
    console.log("Decoded token:", decoded);
    
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
    
    console.log("Looking for user with ID:", decoded.userId);
    
    // Try to find user by ObjectId first
    let user = null;
    try {
      user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
    } catch (objectIdError) {
      console.log("ObjectId conversion failed, trying string match:", objectIdError);
      // If ObjectId conversion fails, try finding by string ID or other fields
      user = await usersCollection.findOne({ 
        $or: [
          { _id: decoded.userId },
          { username: decoded.userId },
          { email: decoded.userId }
        ]
      });
    }
    
    console.log("Found user:", user ? "Yes" : "No");
    
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
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      name: user.full_name || user.name || user.username,
      bio: user.bio || "",
      avatar: user.avatar_url || user.avatar || "/placeholder-user.jpg",
      avatar_url: user.avatar_url || user.avatar || "/placeholder-user.jpg",
      followers: user.followers_count || user.followers || 0,
      following: user.following_count || user.following || 0,
      verified: user.is_verified || user.verified || false,
      posts_count: user.posts_count || 0
    });
  } catch (error: any) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { message: "Failed to get user profile" },
      { status: 500 }
    );
  }
}
