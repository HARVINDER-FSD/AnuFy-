import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { token } from '@/lib/utils';
import { ObjectId } from 'mongodb';

// Get a specific story by ID
export async function GET(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  try {
    const storyId = params.storyId;
    const db = await getDatabase();
    
    const story = await db.collection('stories').aggregate([
      {
        $match: {
          _id: new ObjectId(storyId),
          expires_at: { $gt: new Date() }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          id: { $toString: '$_id' },
          user_id: { $toString: '$user_id' },
          media_url: 1,
          media_type: 1,
          caption: 1,
          created_at: 1,
          expires_at: 1,
          views_count: 1,
          username: '$user.username',
          full_name: '$user.full_name',
          avatar_url: '$user.avatar_url',
          is_verified: '$user.is_verified'
        }
      }
    ]).toArray();
    
    if (story.length === 0) {
      return NextResponse.json(
        { message: 'Story not found or expired' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(story[0]);
    
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
    const db = await getDatabase();
    
    // Check if the story exists and belongs to the user
    const story = await db.collection('stories').findOne({
      _id: new ObjectId(storyId)
    });
    
    if (!story) {
      return NextResponse.json(
        { message: 'Story not found' },
        { status: 404 }
      );
    }
    
    if (story.user_id.toString() !== userId) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this story' },
        { status: 403 }
      );
    }
    
    // Delete the story
    await db.collection('stories').deleteOne({
      _id: new ObjectId(storyId)
    });
    
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