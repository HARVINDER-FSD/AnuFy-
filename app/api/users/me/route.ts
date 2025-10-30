import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
    
    // Try API server with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (fetchError: any) {
      // Only log if it's not a timeout
      if (fetchError.name !== 'AbortError') {
        console.log("API server error:", fetchError.message);
      }
    }
    
    // Fallback: Use JWT token data directly
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }
    
    // Return user data from token
    return NextResponse.json({
      id: decoded.userId,
      username: decoded.username || '',
      email: decoded.email || '',
      name: decoded.name || decoded.username || '',
      bio: decoded.bio || '',
      avatar: decoded.avatar || '/placeholder-user.jpg',
      avatar_url: decoded.avatar || '/placeholder-user.jpg',
      followers: decoded.followers || 0,
      following: decoded.following || 0,
      verified: decoded.verified || false,
      posts_count: decoded.posts_count || 0
    });
    
  } catch (error: any) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { message: "Failed to get user profile" },
      { status: 500 }
    );
  }
}
