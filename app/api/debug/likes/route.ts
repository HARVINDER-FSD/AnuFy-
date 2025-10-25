import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/debug/likes - Check all likes in database
export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies
    const token = cookies.get('client-token')?.value || cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const userId = payload.userId || payload.id

    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()

    console.log('[Debug] Database name:', db.databaseName)
    console.log('[Debug] User ID:', userId)

    // Get ALL likes in the database (not just user's)
    const allLikes = await db.collection('likes').find({}).toArray()
    console.log('[Debug] Total likes in database:', allLikes.length)

    // Get likes for current user
    const userLikes = await db.collection('likes')
      .find({ user_id: new ObjectId(userId) })
      .toArray()
    console.log('[Debug] User likes:', userLikes.length)

    // Get all posts
    const posts = await db.collection('posts')
      .find({ user_id: new ObjectId(userId) })
      .project({ _id: 1, caption: 1, likes_count: 1 })
      .toArray()

    // Check indexes on likes collection
    const indexes = await db.collection('likes').indexes()

    await client.close()

    return NextResponse.json({
      database: db.databaseName,
      userId,
      totalLikesInDatabase: allLikes.length,
      userLikes: userLikes.length,
      allLikes: allLikes.map(like => ({
        id: like._id.toString(),
        post_id: like.post_id.toString(),
        user_id: like.user_id.toString(),
        created_at: like.created_at
      })),
      userLikesDetails: userLikes.map(like => ({
        id: like._id.toString(),
        post_id: like.post_id.toString(),
        user_id: like.user_id.toString(),
        created_at: like.created_at
      })),
      posts: posts.map(post => ({
        id: post._id.toString(),
        caption: post.caption?.substring(0, 50),
        likes_count: post.likes_count || 0
      })),
      indexes
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
