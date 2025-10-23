import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/reels/[reelId]/likes
export async function GET(
  request: NextRequest,
  { params }: { params: { reelId: string } }
) {
  try {
    const { reelId } = params

    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const likesCollection = db.collection('likes')

    const likes = await likesCollection
      .aggregate([
        {
          $match: {
            post_id: new ObjectId(reelId)
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
          $sort: { created_at: -1 }
        }
      ])
      .toArray()

    await client.close()

    const transformedLikes = likes.map((like: any) => ({
      id: like._id.toString(),
      user: {
        id: like.user._id.toString(),
        username: like.user.username,
        full_name: like.user.full_name,
        avatar: like.user.avatar_url,
        avatar_url: like.user.avatar_url,
        is_verified: like.user.is_verified || false
      },
      created_at: like.created_at
    }))

    return NextResponse.json({
      success: true,
      likes: transformedLikes,
      data: { likes: transformedLikes }
    })
  } catch (error: any) {
    console.error('Error fetching reel likes:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch likes' },
      { status: 500 }
    )
  }
}
