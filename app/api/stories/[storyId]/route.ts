import { NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { token } from '@/lib/utils';

// Get a specific story by ID
export async function GET(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  try {
    const storyId = params.storyId;
    
    const result = await query(
      `SELECT s.id, s.user_id, s.media_url, s.media_type, s.caption, 
              s.created_at, s.expires_at, s.views_count,
              u.username, u.full_name, u.avatar_url, u.is_verified
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 AND s.expires_at > NOW()`,
      [storyId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Story not found or expired' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error: any) {
    console.error('Error fetching story:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a story
export async function DELETE(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  try {
    const storyId = params.storyId;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const accessToken = authHeader.split(' ')[1];
    const payload = token.verify(accessToken);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = payload.userId;
    
    // Check if the story exists and belongs to the user
    const checkResult = await query(
      'SELECT user_id FROM stories WHERE id = $1',
      [storyId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Story not found' },
        { status: 404 }
      );
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this story' },
        { status: 403 }
      );
    }
    
    // Delete the story
    await query(
      'DELETE FROM stories WHERE id = $1',
      [storyId]
    );
    
    return NextResponse.json(
      { message: 'Story deleted successfully' }
    );
    
  } catch (error: any) {
    console.error('Error deleting story:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    return NextResponse.json(
      { message },
      { status }
    );
  }
}