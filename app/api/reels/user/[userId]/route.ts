import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/reels/user/[userId] - Get all reels by a user (SAME AS POSTS)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const reelsCollection = db.collection('reels')

    // Get reels with user information (SAME AGGREGATION AS POSTS)
    const reels = await reelsCollection
      .aggregate([
        {
          $match: { 
            user_id: new ObjectId(userId),
            is_deleted: { $ne: true }
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
            _id: 1,
            user_id: 1,
            caption: 1,
            video_url: 1,
            thumbnail_url: 1,
            location: 1,
            created_at: 1,
            updated_at: 1,
            likes_count: 1,
            comments_count: 1,
            views_count: 1,
            shares_count: 1,
            'user._id': 1,
            'user.username': 1,
            'user.full_name': 1,
            'user.avatar_url': 1,
            'user.is_verified': 1
          }
        },
        {
          $sort: { created_at: -1 }
        }
      ])
      .toArray()

    await client.close()

    // Transform the data to match expected format
    const transformedReels = reels.map(reel => ({
      id: reel._id.toString(),
      user_id: reel.user_id.toString(),
      user: {
        id: reel.user._id.toString(),
        username: reel.user.username,
        full_name: reel.user.full_name || reel.user.username,
        avatar: reel.user.avatar_url,
        avatar_url: reel.user.avatar_url,
        is_verified: reel.user.is_verified || false
      },
      caption: reel.caption,
      video: reel.video_url,
      video_url: reel.video_url,
      thumbnail_url: reel.thumbnail_url,
      location: reel.location,
      likes: reel.likes_count || 0,
      likes_count: reel.likes_count || 0,
      comments: reel.comments_count || 0,
      comments_count: reel.comments_count || 0,
      views_count: reel.views_count || 0,
      shares_count: reel.shares_count || 0,
      created_at: reel.created_at,
      timestamp: reel.created_at,
      is_liked: false,
      is_saved: false,
      isOwner: true
    }))

    return NextResponse.json({
      success: true,
      reels: transformedReels,
      data: transformedReels
    })
  } catch (error: any) {
    console.error('Error fetching user reels:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch reels' 
      },
      { status: 500 }
    )
  }
}
