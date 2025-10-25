import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/reels/user/[userId] - Get all reels by a user (SAME AS POSTS)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Get current user ID from cookie for like/save status
    const cookies = request.cookies
    const token = cookies.get('client-token')?.value || cookies.get('token')?.value
    let currentUserId: string | null = null

    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        currentUserId = payload.userId || payload.id
      } catch (e) {
        console.log('Could not decode token')
      }
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const reelsCollection = db.collection('reels')
    const likesCollection = db.collection('reel_likes')
    const bookmarksCollection = db.collection('reel_bookmarks')

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

    // Get like and bookmark status for current user
    let likedReelIds: Set<string> = new Set()
    let savedReelIds: Set<string> = new Set()

    if (currentUserId && ObjectId.isValid(currentUserId)) {
      // Get all reels liked by current user
      const likes = await likesCollection
        .find({ user_id: new ObjectId(currentUserId) })
        .toArray()
      likedReelIds = new Set(likes.map(like => like.reel_id.toString()))

      // Get all reels saved by current user
      const bookmarks = await bookmarksCollection
        .find({ user_id: new ObjectId(currentUserId) })
        .toArray()
      savedReelIds = new Set(bookmarks.map(bookmark => bookmark.reel_id.toString()))
    }

    await client.close()

    // Transform the data to match expected format
    const transformedReels = reels.map(reel => {
      const reelId = reel._id.toString()
      return {
        id: reelId,
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
        is_liked: likedReelIds.has(reelId),
        liked: likedReelIds.has(reelId),
        is_saved: savedReelIds.has(reelId),
        saved: savedReelIds.has(reelId),
        isOwner: currentUserId === reel.user_id.toString()
      }
    })

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
