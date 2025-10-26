import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, users, posts, reels, hashtags
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!query.trim()) {
      return NextResponse.json({
        users: [],
        posts: [],
        reels: [],
        hashtags: []
      });
    }
    
    const { db } = await connectToDatabase();
    const searchRegex = new RegExp(query, 'i');
    
    const results: any = {
      users: [],
      posts: [],
      reels: [],
      hashtags: []
    };
    
    // Search users
    if (type === 'all' || type === 'users') {
      results.users = await db.collection('users')
        .find({
          $or: [
            { username: searchRegex },
            { full_name: searchRegex }
          ],
          is_active: true
        })
        .project({
          _id: 1,
          username: 1,
          full_name: 1,
          avatar_url: 1,
          is_verified: 1
        })
        .limit(limit)
        .toArray();
    }
    
    // Search posts by caption
    if (type === 'all' || type === 'posts') {
      results.posts = await db.collection('posts')
        .aggregate([
          {
            $match: {
              caption: searchRegex
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
          { $unwind: '$user' },
          {
            $project: {
              _id: 1,
              caption: 1,
              media_urls: 1,
              likes_count: 1,
              comments_count: 1,
              created_at: 1,
              user: {
                _id: 1,
                username: 1,
                avatar_url: 1
              }
            }
          },
          { $limit: limit }
        ])
        .toArray();
    }
    
    // Search reels by caption
    if (type === 'all' || type === 'reels') {
      results.reels = await db.collection('reels')
        .aggregate([
          {
            $match: {
              caption: searchRegex
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
          { $unwind: '$user' },
          {
            $project: {
              _id: 1,
              caption: 1,
              video_url: 1,
              thumbnail_url: 1,
              likes_count: 1,
              views_count: 1,
              created_at: 1,
              user: {
                _id: 1,
                username: 1,
                avatar_url: 1
              }
            }
          },
          { $limit: limit }
        ])
        .toArray();
    }
    
    // Search hashtags
    if (type === 'all' || type === 'hashtags') {
      if (query.startsWith('#')) {
        const hashtagQuery = query.substring(1);
        const hashtagRegex = new RegExp(hashtagQuery, 'i');
        
        // Find posts with this hashtag
        const hashtagPosts = await db.collection('posts')
          .aggregate([
            {
              $match: {
                caption: hashtagRegex
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ])
          .toArray();
        
        if (hashtagPosts.length > 0) {
          results.hashtags = [{
            tag: query,
            count: hashtagPosts[0].count
          }];
        }
      }
    }
    
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
