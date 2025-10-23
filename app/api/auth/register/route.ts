import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username, name, email, password } = await req.json();
    
    // Validate required fields
    if (!username || !name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      await client.close();
      return NextResponse.json(
        { message: existingUser.email === email ? "Email already in use" : "Username already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      username,
      name,
      email,
      password: hashedPassword,
      bio: "",
      avatar: "/placeholder-user.jpg",
      followers: 0,
      following: 0,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    await client.close();
    
    // Return success response (excluding password)
    const { password: _, ...userData } = newUser;
    
    return NextResponse.json({
      message: "Registration successful",
      user: {
        ...userData,
        id: result.insertedId.toString()
      }
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: error.message || "Registration failed" },
      { status: error.status || 500 }
    );
  }
}