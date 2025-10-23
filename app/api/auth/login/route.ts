import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      await client.close();
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      await client.close();
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie for server-side access
    cookies().set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    
    // Also set a non-httpOnly cookie for client-side access
    cookies().set({
      name: 'client-token',
      value: token,
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    await client.close();
    
    // Return user data and token with the correct structure expected by the frontend
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
        verified: user.verified || false
      },
      token: token
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: error.message || "Login failed" },
      { status: error.status || 401 }
    );
  }
}