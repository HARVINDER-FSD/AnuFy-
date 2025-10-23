import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Get a specific reel by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { reelId: string } }
) {
  try {
    const reelId = params.reelId;
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    const reel = await db.collection('reels')
      .aggregate([
        { $match: { _id: new ObjectId(reelId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            user_id: 1,
            video_url: 1,
            thumbnail_url: 1,
            caption: 1,
            location: 1,
            likes_count: 1,
            comments_count: 1,
            views_count: 1,
            created_at: 1,
            updated_at: 1,
            user: {
              _id: 1,
              username: 1,
              full_name: 1,
              avatar_url: 1,
              is_verified: 1
            }
          }
        }
      ])
      .toArray();
    
    await client.close();
    
    if (reel.length === 0) {
      return NextResponse.json({ message: 'Reel not found' }, { status: 404 });
    }
    
    const transformedReel = {
      id: reel[0]._id.toString(),
      user_id: reel[0].user_id.toString(),
      video_url: reel[0].video_url,
      thumbnail_url: reel[0].thumbnail_url,
      caption: reel[0].caption,
      location: reel[0].location,
      likes_count: reel[0].likes_count || 0,
      comments_count: reel[0].comments_count || 0,
      views_count: reel[0].views_count || 0,
      created_at: reel[0].created_at,
      updated_at: reel[0].updated_at,
      user: {
        id: reel[0].user._id.toString(),
        username: reel[0].user.username,
        full_name: reel[0].user.full_name,
        avatar_url: reel[0].user.avatar_url,
        is_verified: reel[0].user.is_verified || false
      }
    };
    
    return NextResponse.json(transformedReel);
    
  } catch (error: any) {
    console.error('Error fetching reel:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a reel
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reelId: string } }
) {
  try {
    const reelId = params.reelId;
    const authHeader = request.headers.get('Authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = decoded.userId;
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if the reel exists and belongs to the user
    const existingReel = await db.collection('reels').findOne({
      _id: new ObjectId(reelId)
    });
    
    if (!existingReel) {
      await client.close();
      return NextResponse.json({ message: 'Reel not found' }, { status: 404 });
    }
    
    if (existingReel.user_id.toString() !== userId) {
      await client.close();
      return NextResponse.json({ message: 'You are not authorized to update this reel' }, { status: 403 });
    }
    
    const body = await request.json();
    const { caption, location } = body;
    
    // Update the reel
    const result = await db.collection('reels').updateOne(
      { _id: new ObjectId(reelId) },
      { 
        $set: { 
          caption: caption || existingReel.caption,
          location: location !== undefined ? location : existingReel.location,
          updated_at: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      await client.close();
      return NextResponse.json({ message: 'No changes made' }, { status: 400 });
    }
    
    // Fetch updated reel
    const updatedReel = await db.collection('reels').findOne({
      _id: new ObjectId(reelId)
    });
    
    await client.close();
    
    return NextResponse.json({
      id: updatedReel._id.toString(),
      user_id: updatedReel.user_id.toString(),
      video_url: updatedReel.video_url,
      thumbnail_url: updatedReel.thumbnail_url,
      caption: updatedReel.caption,
      location: updatedReel.location,
      likes_count: updatedReel.likes_count,
      comments_count: updatedReel.comments_count,
      views_count: updatedReel.views_count,
      created_at: updatedReel.created_at,
      updated_at: updatedReel.updated_at
    });
    
  } catch (error: any) {
    console.error('Error updating reel:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}

// Delete a reel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reelId: string } }
) {
  try {
    const reelId = params.reelId;
    const authHeader = request.headers.get('Authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = decoded.userId;
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Check if the reel exists and belongs to the user
    const existingReel = await db.collection('reels').findOne({
      _id: new ObjectId(reelId)
    });
    
    if (!existingReel) {
      await client.close();
      return NextResponse.json({ message: 'Reel not found' }, { status: 404 });
    }
    
    if (existingReel.user_id.toString() !== userId) {
      await client.close();
      return NextResponse.json({ message: 'You are not authorized to delete this reel' }, { status: 403 });
    }
    
    // Delete the reel
    await db.collection('reels').deleteOne({
      _id: new ObjectId(reelId)
    });
    
    await client.close();
    
    return NextResponse.json({ message: 'Reel deleted successfully' });
    
  } catch (error: any) {
    console.error('Error deleting reel:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}