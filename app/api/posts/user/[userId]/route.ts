import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/posts/user/[userId] - Get all posts by a user (EXACT SAME AS FEED)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    console.log('Fetching posts for user:', userId)

    // Connect to MongoDB (same as feed)
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const postsCollection = db.collection('posts')

    // Get posts with user information (EXACT SAME AGGREGATION AS FEED)
    const posts = await postsCollection
      .aggregate([
        {
          $match: { 
            user_id: new ObjectId(userId),
            is_archived: { $ne: true },
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
            media_urls: 1,
            media_type: 1,
            location: 1,
            created_at: 1,
            updated_at: 1,
            likes_count: 1,
            comments_count: 1,
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

    console.log('Found posts:', posts.length)
    if (posts.length > 0) {
      console.log('First post user:', posts[0].user)
    }

    // Transform the data to match expected format (SAME AS FEED)
    const transformedPosts = posts.map(post => ({
      id: post._id.toString(),
      user_id: post.user_id.toString(),
      user: {
        id: post.user._id.toString(),
        username: post.user.username,
        full_name: post.user.full_name || post.user.username,
        avatar: post.user.avatar_url,
        avatar_url: post.user.avatar_url,
        is_verified: post.user.is_verified || false
      },
      caption: post.caption,
      content: post.caption,
      image: post.media_urls?.[0],
      media_urls: post.media_urls,
      media_type: post.media_type,
      location: post.location,
      likes: post.likes_count || 0,
      likes_count: post.likes_count || 0,
      comments: post.comments_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      created_at: post.created_at,
      timestamp: post.created_at,
      is_liked: false, // TODO: Check if current user liked
      is_saved: false  // TODO: Check if current user saved
    }))

    console.log('Transformed posts:', transformedPosts.length)

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      data: transformedPosts
    })
  } catch (error: any) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch posts' 
      },
      { status: 500 }
    )
  }
}
