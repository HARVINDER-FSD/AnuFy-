import { NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { token } from '@/lib/utils';

// Get all users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    
    const result = await query(
      `SELECT id, username, full_name, avatar_url, bio, website, is_verified, created_at
       FROM users
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return NextResponse.json(result.rows);
    
  } catch (error: any) {
    console.error('Error fetching users:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}