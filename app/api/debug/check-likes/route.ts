import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/debug/check-likes - Debug endpoint to check likes in database
export async function GET(request: NextRequest) {
  try {
    // Get current user ID from cookie
    const cookies = request.cookies
    const token = cookies.get('client-token')?.value || cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 })
    }

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const userId = payload.userId || payload.id

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()

    // Get all posts by this user
    const posts = await db.collection('posts')
      .find({ user_id: new ObjectId(userId) })
      .toArray()

    // Get all likes by this user
    const likes = await db.collection('likes')
      .find({ user_id: new ObjectId(userId) })
      .toArray()

    // Get all likes for this user's posts
    const postIds = posts.map(p => p._id)
    const likesOnMyPosts = await db.collection('likes')
      .find({ post_id: { $in: postIds } })
      .toArray()

    await client.close()

    return NextResponse.json({
      success: true,
      userId,
      debug: {
        myPosts: posts.map(p => ({
          id: p._id.toString(),
          caption: p.caption,
          likes_count: p.likes_count || 0,
          created_at: p.created_at
        })),
        myLikes: likes.map(l => ({
          id: l._id.toString(),
          post_id: l.post_id.toString(),
          created_at: l.created_at
        })),
        likesOnMyPosts: likesOnMyPosts.map(l => ({
          id: l._id.toString(),
          post_id: l.post_id.toString(),
          user_id: l.user_id.toString(),
          created_at: l.created_at
        }))
      }
    })
  } catch (error: any) {
    console.error('Debug check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
