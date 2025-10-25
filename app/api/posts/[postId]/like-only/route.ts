import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// POST /api/posts/[postId]/like-only - ONLY LIKE (never unlike)
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
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

    // Check if post exists
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) })
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await db.collection('likes').findOne({
      post_id: new ObjectId(postId),
      user_id: new ObjectId(userId)
    })

    if (existingLike) {
      // Already liked - just return success (idempotent)
      const likeCount = await db.collection('likes').countDocuments({
        post_id: new ObjectId(postId)
      })

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount,
        message: 'Already liked'
      })
    }

    // Not liked yet - add the like
    await db.collection('likes').insertOne(
      {
        post_id: new ObjectId(postId),
        user_id: new ObjectId(userId),
        created_at: new Date()
      },
      { writeConcern: { w: 'majority', j: true, wtimeout: 5000 } }
    )

    // Create notification (if not own post)
    if (post.user_id && post.user_id.toString() !== userId) {
      await db.collection('notifications').insertOne({
        type: 'like',
        to_user_id: new ObjectId(post.user_id),
        from_user_id: new ObjectId(userId),
        post_id: new ObjectId(postId),
        read: false,
        created_at: new Date()
      }).catch(() => { })
    }

    const likeCount = await db.collection('likes').countDocuments({
      post_id: new ObjectId(postId)
    })

    return NextResponse.json({
      success: true,
      liked: true,
      likeCount
    })
  } catch (error: any) {
    console.error('[Like-Only API] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed' }, { status: 500 })
  }
}
