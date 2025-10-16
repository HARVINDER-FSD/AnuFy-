import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import rateLimit from "express-rate-limit"
import { createServer } from "http"
import { initializeWebSocket } from "./lib/websocket"
import { connectDatabase } from "./lib/database"
import { connectRedis } from "./lib/config"
import { initializeElasticsearch } from "./lib/elasticsearch"
import { initializeKafka } from "./lib/kafka"

import authRoutes from "./routes/auth"
import userRoutes from "./routes/users"
import postRoutes from "./routes/posts"
import feedRoutes from "./routes/feed"
import uploadRoutes from "./routes/upload"
import storyRoutes from "./routes/stories"
import reelRoutes from "./routes/reels"
import chatRoutes from "./routes/chat"
import notificationRoutes from "./routes/notifications"
import searchRoutes from "./routes/search"
import analyticsRoutes from "./routes/analytics"
import moderationRoutes from "./routes/moderation"

const app = express()
const server = createServer(app)

app.use(helmet())
app.use(compression())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
})
app.use(limiter)

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/feed", feedRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/stories", storyRoutes)
app.use("/api/reels", reelRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/search", searchRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/moderation", moderationRoutes)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    error: "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

async function startServer() {
  try {
    // Initialize database connections
    await connectDatabase()
    await connectRedis()

    // Initialize external services
    await initializeElasticsearch()
    await initializeKafka()

    // Initialize WebSocket
    initializeWebSocket(server)

    const PORT = process.env.PORT || 3001
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
    process.exit(0)
  })
})

startServer()

export default app
