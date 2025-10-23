import { NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { token } from '@/lib/utils';

// Get a specific post by ID
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
    
    const result = await query(
      `SELECT p.id, p.user_id, p.caption, p.media_urls, p.media_type, p.location, 
              p.created_at, p.updated_at, p.likes_count, p.comments_count,
              u.username, u.full_name, u.avatar_url, u.is_verified
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.is_archived = false`,
      [postId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error: any) {
    console.error('Error fetching post:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a post
export async function PUT(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
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
    
    // Check if the post exists and belongs to the user
    const checkResult = await query(
      'SELECT user_id FROM posts WHERE id = $1 AND is_archived = false',
      [postId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { message: 'You are not authorized to update this post' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { caption, location } = body;
    
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    if (caption !== undefined) {
      updateFields.push(`caption = $${valueIndex}`);
      values.push(caption);
      valueIndex++;
    }
    
    if (location !== undefined) {
      updateFields.push(`location = $${valueIndex}`);
      values.push(location);
      valueIndex++;
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }
    
    values.push(postId);
    
    const result = await query(
      `UPDATE posts
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${valueIndex}
       RETURNING id, user_id, caption, media_urls, media_type, location, created_at, updated_at`,
      values
    );
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error: any) {
    console.error('Error updating post:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    return NextResponse.json(
      { message },
      { status }
    );
  }
}

// Delete a post
export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId;
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
    
    // Check if the post exists and belongs to the user
    const checkResult = await query(
      'SELECT user_id FROM posts WHERE id = $1 AND is_archived = false',
      [postId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this post' },
        { status: 403 }
      );
    }
    
    // Soft delete the post
    await query(
      'UPDATE posts SET is_archived = true, updated_at = NOW() WHERE id = $1',
      [postId]
    );
    
    return NextResponse.json(
      { message: 'Post deleted successfully' }
    );
    
  } catch (error: any) {
    console.error('Error deleting post:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    
    return NextResponse.json(
      { message },
      { status }
    );
  }
}