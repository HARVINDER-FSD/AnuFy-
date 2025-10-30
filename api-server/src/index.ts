// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'
// When running with tsx, __dirname is api-server/src, so go up one level to api-server
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })
console.log('Loaded .env from:', path.resolve(__dirname, '..', '.env'))
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI)
console.log('MONGODB_URI value:', process.env.MONGODB_URI?.substring(0, 50))

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth'
import usersRoutes from './routes/users'
import postsRoutes from './routes/posts'
import reelsRoutes from './routes/reels'
import storiesRoutes from './routes/stories'
import notificationsRoutes from './routes/notifications'
import chatRoutes from './routes/chat'
import uploadRoutes from './routes/upload'
import feedRoutes from './routes/feed'
import exploreRoutes from './routes/explore'
import reportsRoutes from './routes/reports'
import searchRoutes from './routes/search'
import analyticsRoutes from './routes/analytics'
import bookmarksRoutes from './routes/bookmarks'

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for now, restrict in production
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Anufy API Server is running' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/reels', reelsRoutes)
app.use('/api/stories', storiesRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/feed', feedRoutes)
app.use('/api/explore', exploreRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/bookmarks', bookmarksRoutes)

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Anufy API Server running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
  console.log(`📍 Auth routes: http://localhost:${PORT}/api/auth/*`)
  console.log(`📍 User routes: http://localhost:${PORT}/api/users/*`)
  console.log(`📍 Post routes: http://localhost:${PORT}/api/posts/*`)
  console.log(`📍 Reel routes: http://localhost:${PORT}/api/reels/*`)
  console.log(`📍 Story routes: http://localhost:${PORT}/api/stories/*`)
  console.log(`📍 Notification routes: http://localhost:${PORT}/api/notifications/*`)
  console.log(`📍 Chat routes: http://localhost:${PORT}/api/chat/*`)
  console.log(`📍 Upload routes: http://localhost:${PORT}/api/upload/*`)
  console.log(`📍 Feed routes: http://localhost:${PORT}/api/feed/*`)
  console.log(`📍 Explore routes: http://localhost:${PORT}/api/explore/*`)
  console.log(`📍 Reports routes: http://localhost:${PORT}/api/reports/*`)
  console.log(`📍 Search routes: http://localhost:${PORT}/api/search/*`)
  console.log(`📍 Analytics routes: http://localhost:${PORT}/api/analytics/*`)
  console.log(`📍 Bookmarks routes: http://localhost:${PORT}/api/bookmarks/*`)
})

export default app
