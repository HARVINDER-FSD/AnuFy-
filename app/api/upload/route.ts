import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// For App Router (Next.js 13+) - Configure route to handle large files
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

// Note: Body size limit is configured in next.config.mjs

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcm470yhl',
  api_key: process.env.CLOUDINARY_API_KEY || '832377464323471',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'RV8uRIhI2IL5eyl6InvU5s8OX2g',
});


export const dynamic = 'force-dynamic';

// Generate Cloudinary upload signature
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Check for token in cookies as fallback
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=')) || parts.find(c => c.startsWith('client-token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        { message: 'You must be logged in to upload media' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Generate upload signature for client-side upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'social-media';
    const publicId = `${decoded.userId}_${Date.now()}`;

    // Return Cloudinary config for direct upload from client
    return NextResponse.json({
      success: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dcm470yhl',
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'profilePicsUnsigned',
      folder: folder,
      publicId: publicId,
      timestamp: timestamp,
    });

  } catch (error: any) {
    console.error('Upload config error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to generate upload config' },
      { status: 500 }
    );
  }
}
