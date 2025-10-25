import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import jwt from 'jsonwebtoken'

const MONGODB_URI = process.env.MONGODB_URI || ''
const JWT_SECRET = process.env.JWT_SECRET || ''

let cachedClient: MongoClient | null = null

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient
  }
  cachedClient = await MongoClient.connect(MONGODB_URI)
  return cachedClient
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const cookies = request.headers.get('cookie')
    let token = null
    
    if (cookies) {
      const parts = cookies.split(';').map(c => c.trim())
      const tokenCookie = parts.find(c => c.startsWith('client-token=') || c.startsWith('token='))
      if (tokenCookie) {
        token = tokenCookie.split('=')[1]
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId
    
    // Get FCM token from request
    const { fcmToken } = await request.json()
    
    if (!fcmToken) {
      return NextResponse.json(
        { message: 'FCM token is required' },
        { status: 400 }
      )
    }
    
    // Save FCM token to user document
    const client = await getMongoClient()
    const db = client.db()
    
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          fcmToken: fcmToken,
          fcmTokenUpdatedAt: new Date()
        }
      }
    )
    
    return NextResponse.json({
      message: 'FCM token registered successfully'
    })
    
  } catch (error: any) {
    console.error('Error registering FCM token:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
