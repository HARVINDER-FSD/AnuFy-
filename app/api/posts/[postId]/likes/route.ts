import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/posts/[postId]/likes - Get all users who liked a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const likesCollection = db.collection('likes')

    // Get likes with user information
    const likes = await likesCollection
      .aggregate([
        {
          $match: { 
            post_id: new ObjectId(postId)
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

    // Transform to match expected format
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
      data: {
        likes: transformedLikes
      }
    })
  } catch (error: any) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch likes' 
      },
      { status: 500 }
    )
  }
}
