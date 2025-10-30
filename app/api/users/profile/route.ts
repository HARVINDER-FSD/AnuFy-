import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.get('authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.get('token')?.value || req.cookies.get('client-token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );
    }

    // Verify JWT and get user ID
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('[Profile Update API] Received update data:', body);

    // Connect to MongoDB using shared connection
    const { db } = await connectToDatabase();

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) updateData.full_name = body.name;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar;
      updateData.avatar_url = body.avatar;
    }
    if (body.website !== undefined) updateData.website = body.website;
    if (body.location !== undefined) updateData.location = body.location;

    console.log('[Profile Update API] Updating user with data:', updateData);

    // Update user in MongoDB
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(decoded.userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log('[Profile Update API] User updated successfully');

    // Return updated user data
    const timestamp = Date.now();
    const avatarValue = result.avatar || result.avatar_url || '/placeholder-user.jpg';

    const updatedData = {
      id: result._id.toString(),
      username: result.username,
      email: result.email,
      name: result.full_name || result.name || '',
      bio: result.bio || '',
      avatar: avatarValue.includes('?') ? `${avatarValue}&t=${timestamp}` : `${avatarValue}?t=${timestamp}`,
      avatar_url: avatarValue.includes('?') ? `${avatarValue}&t=${timestamp}` : `${avatarValue}?t=${timestamp}`,
      followers: result.followers_count || result.followers || 0,
      following: result.following_count || result.following || 0,
      verified: result.is_verified || result.verified || false,
      posts_count: result.posts_count || 0,
      website: result.website || '',
      location: result.location || ''
    };

    return NextResponse.json(updatedData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Failed to update profile", error: error.message },
      { status: 500 }
    );
  }
}
