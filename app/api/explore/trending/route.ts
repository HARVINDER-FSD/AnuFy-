import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all'; // all, posts, reels, users
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const { db } = await connectToDatabase();
    
    // Get trending content from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const results: any = {};
    
    // Trending posts (most likes + comments in last 7 days)
    if (category === 'all' || category === 'posts') {
      results.posts = await db.collection('posts')
        .aggregate([
          {
            $match: {
              created_at: { $gte: sevenDaysAgo }
            }
          },
          {
            $addFields: {
              engagement: {
                $add: [
                  { $ifNull: ['$likes_count', 0] },
                  { $multiply: [{ $ifNull: ['$comments_count', 0] }, 2] } // Comments worth 2x
                ]
              }
            }
          },
          { $sort: { engagement: -1 } },
          { $limit: limit },
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
              caption: 1,
              media_urls: 1,
              likes_count: 1,
              comments_count: 1,
              created_at: 1,
              engagement: 1,
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
    }
    
    // Trending reels (most views + likes in last 7 days)
    if (category === 'all' || category === 'reels') {
      results.reels = await db.collection('reels')
        .aggregate([
          {
            $match: {
              created_at: { $gte: sevenDaysAgo }
            }
          },
          {
            $addFields: {
              engagement: {
                $add: [
                  { $ifNull: ['$views_count', 0] },
                  { $multiply: [{ $ifNull: ['$likes_count', 0] }, 5] } // Likes worth 5x
                ]
              }
            }
          },
          { $sort: { engagement: -1 } },
          { $limit: limit },
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
              caption: 1,
              video_url: 1,
              thumbnail_url: 1,
              likes_count: 1,
              views_count: 1,
              comments_count: 1,
              created_at: 1,
              engagement: 1,
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
    }
    
    // Suggested users (most followers gained in last 7 days)
    if (category === 'all' || category === 'users') {
      results.users = await db.collection('users')
        .find({
          is_active: true,
          created_at: { $gte: sevenDaysAgo }
        })
        .sort({ followers_count: -1 })
        .limit(limit)
        .project({
          _id: 1,
          username: 1,
          full_name: 1,
          avatar_url: 1,
          is_verified: 1,
          followers_count: 1
        })
        .toArray();
    }
    
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error('Error fetching trending content:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
