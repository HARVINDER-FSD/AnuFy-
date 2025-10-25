import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/posts/user/[userId] - Get all posts by a user (EXACT SAME AS FEED)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    console.log('Fetching posts for user:', userId)

    // Get current user ID from cookie for like/save status
    const cookies = request.cookies
    const token = cookies.get('client-token')?.value || cookies.get('token')?.value
    let currentUserId: string | null = null

    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        currentUserId = payload.userId || payload.id
        console.log('Current user ID:', currentUserId)
      } catch (e) {
        console.log('Could not decode token')
      }
    }

    // Connect to MongoDB (same as feed)
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const postsCollection = db.collection('posts')
    const likesCollection = db.collection('likes')
    const bookmarksCollection = db.collection('bookmarks')

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

    console.log('Found posts:', posts.length)

    // Get like and bookmark status for current user
    let likedPostIds: Set<string> = new Set()
    let savedPostIds: Set<string> = new Set()

    if (currentUserId && ObjectId.isValid(currentUserId)) {
      console.log('[User Posts API] Querying likes for user:', currentUserId)
      console.log('[User Posts API] Database:', db.databaseName)
      
      // Get all posts liked by current user
      const likes = await likesCollection
        .find({ user_id: new ObjectId(currentUserId) })
        .toArray()
      
      console.log('[User Posts API] Found likes:', likes.length)
      if (likes.length > 0) {
        console.log('[User Posts API] Sample like:', JSON.stringify(likes[0], null, 2))
        console.log('[User Posts API] All like post_ids:', likes.map(l => l.post_id.toString()))
      }
      
      likedPostIds = new Set(likes.map(like => like.post_id.toString()))

      // Get all posts saved by current user
      const bookmarks = await bookmarksCollection
        .find({ user_id: new ObjectId(currentUserId) })
        .toArray()
      savedPostIds = new Set(bookmarks.map(bookmark => bookmark.post_id.toString()))

      console.log('[User Posts API] User has liked', likedPostIds.size, 'posts:', Array.from(likedPostIds))
      console.log('[User Posts API] User has saved', savedPostIds.size, 'posts')
    } else {
      console.log('[User Posts API] No current user ID or invalid format')
    }

    await client.close()

    // Transform the data to match expected format (SAME AS FEED)
    const transformedPosts = posts.map(post => {
      const postId = post._id.toString()
      const isLiked = likedPostIds.has(postId)
      
      console.log(`[User Posts API] Post ${postId}: is_liked=${isLiked}, likes_count=${post.likes_count || 0}`)
      
      return {
        id: postId,
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
        is_liked: isLiked,
        liked: isLiked,
        is_saved: savedPostIds.has(postId),
        saved: savedPostIds.has(postId)
      }
    })

    console.log('[User Posts API] Transformed posts:', transformedPosts.length)

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
