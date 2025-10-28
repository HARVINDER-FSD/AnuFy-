# Anufy API Server

A standalone Express.js API server for the Anufy social media platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL or MongoDB
- Redis (optional, for caching)

### Installation

```bash
cd api-server
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
```

### Run Development Server

```bash
npm run dev
```

Server will start on http://localhost:3001

## 📁 Project Structure

```
api-server/
├── src/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── lib/             # Utilities & integrations
│   ├── config/          # Configuration
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   └── index.ts         # Entry point
├── tests/               # Test files
├── package.json
└── tsconfig.json
```

See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for detailed documentation.

## 🛣️ API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search` - Search users
- `POST /api/users/:userId/follow` - Follow user
- `DELETE /api/users/:userId/follow` - Unfollow user

### Posts
- `GET /api/posts/feed` - Get personalized feed
- `POST /api/posts` - Create post
- `GET /api/posts/:postId` - Get post
- `PUT /api/posts/:postId` - Update post
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/like` - Like post
- `DELETE /api/posts/:postId/like` - Unlike post
- `GET /api/posts/:postId/comments` - Get comments
- `POST /api/posts/:postId/comments` - Add comment

### Reels
- `GET /api/reels` - Get reels feed
- `POST /api/reels` - Create reel
- `GET /api/reels/:reelId` - Get reel
- `DELETE /api/reels/:reelId` - Delete reel
- `POST /api/reels/:reelId/like` - Like reel
- `GET /api/reels/user/:userId` - Get user reels

### Stories
- `GET /api/stories` - Get stories feed
- `POST /api/stories` - Create story
- `GET /api/stories/user/:userId` - Get user stories
- `DELETE /api/stories/:storyId` - Delete story
- `POST /api/stories/:storyId/view` - View story
- `GET /api/stories/:storyId/views` - Get story views

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/read-all` - Mark all as read
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Chat
- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversations/direct` - Create direct chat
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `POST /api/chat/messages/read` - Mark messages as read
- `DELETE /api/chat/messages/:id` - Delete message

### Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/presigned-url` - Get presigned URL
- `DELETE /api/upload/:key` - Delete file

### Explore
- `GET /api/explore/trending` - Get trending content
- `GET /api/explore/suggested-users` - Get suggested users
- `GET /api/explore/feed` - Get explore feed

### Search
- `GET /api/search/users` - Search users
- `GET /api/search/posts` - Search posts
- `GET /api/search/hashtags` - Search hashtags
- `GET /api/search/trending` - Get trending hashtags
- `GET /api/search/global` - Global search

### Analytics
- `POST /api/analytics/track` - Track event
- `GET /api/analytics/user/:userId` - Get user analytics
- `GET /api/analytics/post/:postId` - Get post analytics

### Reports
- `POST /api/reports` - Create report
- `GET /api/reports/user` - Get user reports

### Bookmarks
- `GET /api/bookmarks` - Get bookmarks
- `POST /api/bookmarks/:postId` - Add bookmark
- `DELETE /api/bookmarks/:postId` - Remove bookmark

## 🔒 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚢 Deployment

### Vercel (Serverless)
```bash
vercel deploy
```

### Docker
```bash
docker build -t anufy-api .
docker run -p 3001:3001 anufy-api
```

### PM2 (Process Manager)
```bash
pm2 start npm --name "anufy-api" -- start
```

## 📊 Monitoring

- Health check: `GET /health`
- Metrics: `GET /metrics` (if enabled)

## 🔧 Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

### Code Style
- ESLint for linting
- Prettier for formatting
- TypeScript for type safety

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/anufy/issues)
- Email: support@anufy.com
- Documentation: [Full API Docs](https://docs.anufy.com)

## 🎯 Roadmap

- [ ] GraphQL API support
- [ ] WebSocket real-time updates
- [ ] Rate limiting per user
- [ ] API versioning
- [ ] Swagger/OpenAPI documentation
- [ ] Performance monitoring
- [ ] Automated testing CI/CD

## 📚 Additional Documentation

- [Folder Structure](./FOLDER_STRUCTURE.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

Built with ❤️ by the Anufy Team
