import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redis } from '@/lib/database';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get the current user from the token
    const auth = await verifyAuth(req);
    
    if (auth.success && auth.userId) {
      // Get the token from cookies
      const tokenCookie = req.cookies.get('token');
      
      if (tokenCookie && tokenCookie.value) {
        // Invalidate the session in Redis if it exists
        await redis.del(`session:${auth.userId}:${tokenCookie.value}`);
      }
    }
    
    // Create a response that will clear the cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    // Clear the token cookie with proper attributes
    response.cookies.set({
      name: 'token',
      value: '',
      expires: new Date(0),
      path: '/',
      sameSite: 'strict',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to logout' },
      { status: 500 }
    );
  }
}