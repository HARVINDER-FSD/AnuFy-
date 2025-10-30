import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Get all users

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const db = await getDatabase();
    const users = await db.collection('users')
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .project({
        id: { $toString: '$_id' },
        username: 1,
        full_name: 1,
        avatar_url: 1,
        bio: 1,
        website: 1,
        is_verified: 1,
        created_at: 1
      })
      .toArray();
    
    return NextResponse.json(users);
    
  } catch (error: any) {
    console.error('Error fetching users:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}