import { Router, Request, Response } from 'express'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'
const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192'

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      })
    }
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const usersCollection = db.collection('users')

    // Find user by email
    const user = await usersCollection.findOne({ email })
    
    if (!user) {
      await client.close()
      return res.status(401).json({
        message: "Invalid email or password"
      })
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      await client.close()
      return res.status(401).json({
        message: "Invalid email or password"
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set httpOnly cookie for server-side access
    res.cookie('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in milliseconds
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    
    // Also set a non-httpOnly cookie for client-side access
    res.cookie('client-token', token, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in milliseconds
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    await client.close()
    
    // Return user data and token
    return res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name || "",
        bio: user.bio || "",
        avatar: user.avatar || "/placeholder-user.jpg",
        followers: user.followers || 0,
        following: user.following || 0,
        verified: user.verified || false
      },
      token: token
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return res.status(error.status || 401).json({
      message: error.message || "Login failed"
    })
  }
})

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username, name } = req.body
    
    // Validate required fields
    if (!email || !password || !username) {
      return res.status(400).json({
        message: "Email, password, and username are required"
      })
    }
    
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db()
    const usersCollection = db.collection('users')

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      $or: [{ email }, { username }] 
    })
    
    if (existingUser) {
      await client.close()
      return res.status(400).json({
        message: existingUser.email === email 
          ? "Email already registered" 
          : "Username already taken"
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const result = await usersCollection.insertOne({
      email,
      password: hashedPassword,
      username,
      name: name || username,
      bio: "",
      avatar: "/placeholder-user.jpg",
      followers: 0,
      following: 0,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId.toString(),
        email,
        username,
        name: name || username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set cookies
    res.cookie('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    
    res.cookie('client-token', token, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    await client.close()
    
    return res.json({
      user: {
        id: result.insertedId.toString(),
        username,
        email,
        name: name || username,
        bio: "",
        avatar: "/placeholder-user.jpg",
        followers: 0,
        following: 0,
        verified: false
      },
      token
    })
  } catch (error: any) {
    console.error("Register error:", error)
    return res.status(500).json({
      message: error.message || "Registration failed"
    })
  }
})

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token')
  res.clearCookie('client-token')
  return res.json({ message: "Logged out successfully" })
})

export default router
