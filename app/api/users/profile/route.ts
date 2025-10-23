import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from 'mongodb'
import { verifyAuth } from "@/lib/auth"

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';


export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    // Get user from token
    const authResult = await verifyAuth(req);
    
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const userId = authResult.userId;
    const data = await req.json();
    
    console.log("Updating profile for user:", userId, "with data:", data);
    
    // Validate required fields
    if (!data.full_name && !data.username && !data.bio && !data.website && !data.avatar_url) {
      return NextResponse.json({ message: "At least one field is required to update" }, { status: 400 });
    }
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Prepare update fields
    const updateFields: any = {
      updated_at: new Date()
    };
    
    // Only include fields that are provided
    if (data.username !== undefined) updateFields.username = data.username;
    if (data.full_name !== undefined) updateFields.full_name = data.full_name;
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.bio !== undefined) updateFields.bio = data.bio;
    if (data.website !== undefined) updateFields.website = data.website;
    if (data.avatar_url !== undefined) updateFields.avatar_url = data.avatar_url;
    if (data.avatar !== undefined) updateFields.avatar = data.avatar;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.location !== undefined) updateFields.location = data.location;
    if (data.is_private !== undefined) updateFields.is_private = data.is_private;
    
    // Update user in MongoDB
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateFields },
      { 
        returnDocument: 'after',
        projection: { password: 0, password_hash: 0 }
      }
    );
    
    await client.close();
    
    if (!result) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    // Return updated user data
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: result._id.toString(),
        username: result.username,
        full_name: result.full_name || result.name,
        bio: result.bio,
        website: result.website,
        avatar_url: result.avatar_url || result.avatar,
        phone: result.phone,
        location: result.location,
        is_private: result.is_private,
        is_verified: result.is_verified || result.verified,
        updated_at: result.updated_at
      }
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update profile" },
      { status: error.status || 500 }
    );
  }
}