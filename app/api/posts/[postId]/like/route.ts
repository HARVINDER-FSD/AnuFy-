import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// POST /api/posts/[postId]/like - Toggle like (atomic operation)
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const requestId = Math.random().toString(36).substring(7)
  const timestamp = new Date().toISOString()
  
  try {
    const { postId } = params

    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ success: false, error: 'Invalid post ID' }, { status: 400 })
    }

    const cookies = request.cookies
    const token = cookies.get('client-token')?.value || cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const userId = payload.userId || payload.id

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    console.log(`\n========== LIKE API REQUEST [${requestId}] at ${timestamp} ==========`)
    console.log('[Like API] Database:', db.databaseName)
    console.log('[Like API] Post ID:', postId)
    console.log('[Like API] User ID:', userId)
    console.log('[Like API] Referer:', request.headers.get('referer'))
    console.log('[Like API] User-Agent:', request.headers.get('user-agent')?.substring(0, 50))

    // Check if post exists
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) })
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // Check current like status FIRST
    const likeQuery = {
      post_id: new ObjectId(postId),
      user_id: new ObjectId(userId)
    }

    const existingLike = await db.collection('likes').findOne(likeQuery)
    const currentlyLiked = !!existingLike

    console.log('[Like API] Current status:', currentlyLiked ? 'LIKED' : 'NOT LIKED')

    let liked = false

    if (currentlyLiked) {
      // Currently liked, so unlike it
      const deleteResult = await db.collection('likes').deleteOne(likeQuery)
      liked = false
      console.log('[Like API] Unliked post - Deleted:', deleteResult.deletedCount)

      // Update post likes count in the posts collection
      await db.collection('posts').updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { likes_count: -1 } }
      )
      console.log('[Like API] Updated post likes_count (decreased)')

      // Remove notification
      await db.collection('notifications').deleteOne({
        type: 'like',
        post_id: new ObjectId(postId),
        from_user_id: new ObjectId(userId)
      })
    } else {
      // Not currently liked, so like it
      try {
        const insertResult = await db.collection('likes').insertOne(
          {
            post_id: new ObjectId(postId),
            user_id: new ObjectId(userId),
            created_at: new Date()
          }
        )
        liked = true
        console.log('[Like API] Liked post - Insert acknowledged:', insertResult.acknowledged)

        // Update post likes count in the posts collection
        await db.collection('posts').updateOne(
          { _id: new ObjectId(postId) },
          { $inc: { likes_count: 1 } }
        )
        console.log('[Like API] Updated post likes_count (increased)')

        // Verify immediately
        const verify = await db.collection('likes').findOne(likeQuery)
        if (!verify) {
          console.error('[Like API] CRITICAL: Like was NOT saved to database!')
          throw new Error('Like was not saved')
        }
        console.log('[Like API] Verified like exists in database')

        // Create notification (if not own post)
        if (post.user_id && post.user_id.toString() !== userId) {
          await db.collection('notifications').insertOne({
            type: 'like',
            to_user_id: new ObjectId(post.user_id),
            from_user_id: new ObjectId(userId),
            post_id: new ObjectId(postId),
            read: false,
            created_at: new Date()
          }).catch(() => { }) // Ignore duplicate notification errors
        }
      } catch (error: any) {
        // If duplicate key error, it means it was already liked
        if (error.code === 11000) {
          liked = true
          console.log('[Like API] Already liked (duplicate key)')
        } else {
          throw error
        }
      }
    }

    // Get final like count
    const likeCount = await db.collection('likes').countDocuments({
      post_id: new ObjectId(postId)
    })

    // Get recent likers
    const recentLikes = await db.collection('likes')
      .aggregate([
        { $match: { post_id: new ObjectId(postId) } },
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $sort: { created_at: -1 } },
        { $limit: 3 },
        { $project: { username: '$user.username' } }
      ])
      .toArray()

    console.log(`[Like API ${requestId}] Final state - liked:`, liked, 'count:', likeCount)
    console.log(`========== END REQUEST [${requestId}] ==========\n`)

    return NextResponse.json({
      success: true,
      liked,
      likeCount,
      likedBy: recentLikes.map((like: any) => like.username)
    })
  } catch (error: any) {
    console.error('[Like API] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed' }, { status: 500 })
  }
}
