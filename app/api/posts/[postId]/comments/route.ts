import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'
const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn'

// Helper to get user ID from token
function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try cookies
      const cookies = request.headers.get('cookie')
      if (cookies) {
        const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token=') || c.trim().startsWith('client-token='))
        if (tokenCookie) {
          const token = tokenCookie.split('=')[1]
          const decoded = jwt.verify(token, JWT_SECRET) as any
          return decoded.userId || decoded.id || null
        }
      }
      return null
    }
    
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.userId || decoded.id || null
  } catch (error) {
    return null
  }
}

// GET /api/posts/[postId]/comments - Get all comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const commentsCollection = db.collection('comments')

    // Get comments with user information
    const comments = await commentsCollection
      .aggregate([
        {
          $match: { 
            post_id: new ObjectId(postId),
            is_deleted: { $ne: true },
            parent_comment_id: null
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
    const transformedComments = comments.map((comment: any) => ({
      id: comment._id.toString(),
      content: comment.content,
      user: {
        id: comment.user._id.toString(),
        username: comment.user.username,
        full_name: comment.user.full_name,
        avatar: comment.user.avatar_url,
        avatar_url: comment.user.avatar_url,
        is_verified: comment.user.is_verified || false
      },
      created_at: comment.created_at,
      likes_count: comment.likes_count || 0,
      replies_count: comment.replies_count || 0,
      is_liked: false
    }))

    return NextResponse.json({
      success: true,
      comments: transformedComments,
      data: {
        comments: transformedComments
      }
    })
  } catch (error: any) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch comments' 
      },
      { status: 500 }
    )
  }
}

// POST /api/posts/[postId]/comments - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const body = await request.json()
    const { content, parent_comment_id } = body

    // Get user ID from token
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const commentsCollection = db.collection('comments')
    const postsCollection = db.collection('posts')
    const usersCollection = db.collection('users')

    // Create comment
    const newComment = {
      post_id: new ObjectId(postId),
      user_id: new ObjectId(userId),
      content: content.trim(),
      parent_comment_id: parent_comment_id ? new ObjectId(parent_comment_id) : null,
      likes_count: 0,
      replies_count: 0,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const result = await commentsCollection.insertOne(newComment)

    // Update post comments count
    await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { comments_count: 1 } }
    )

    // If it's a reply, update parent comment replies count
    if (parent_comment_id) {
      await commentsCollection.updateOne(
        { _id: new ObjectId(parent_comment_id) },
        { $inc: { replies_count: 1 } }
      )
    }

    // Get user data for response
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })

    await client.close()

    // Transform response
    const transformedComment = {
      id: result.insertedId.toString(),
      content: newComment.content,
      user: {
        id: userId,
        username: user?.username || 'Unknown',
        full_name: user?.full_name || user?.username || 'Unknown',
        avatar: user?.avatar_url || '/placeholder-user.jpg',
        avatar_url: user?.avatar_url || '/placeholder-user.jpg',
        is_verified: user?.is_verified || false
      },
      created_at: newComment.created_at,
      likes_count: 0,
      replies_count: 0,
      is_liked: false
    }

    return NextResponse.json({
      success: true,
      comment: transformedComment,
      data: {
        comment: transformedComment
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create comment' 
      },
      { status: 500 }
    )
  }
}
