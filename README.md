# Social Media App

A modern, full-stack social media application built with Next.js, MongoDB, Redis, and Cloudinary. Features include real-time messaging, stories, reels, and comprehensive social interactions.

## 🚀 Features

### Core Features
- **User Authentication**: JWT-based authentication with secure session management
- **Posts**: Create, like, comment, and share posts with media support
- **Stories**: 24-hour disappearing stories with media upload
- **Reels**: Short-form video content with engagement features
- **Real-time Chat**: Socket.io powered messaging with file sharing
- **Profile Management**: User profiles with visitor tracking and privacy controls
- **Settings**: Comprehensive user settings and preferences

### Technical Features
- **Redis Caching**: High-performance caching for sessions, feeds, and analytics
- **Background Jobs**: Queue-based processing for heavy tasks
- **CDN Integration**: Optimized media delivery with Cloudinary
- **Real-time Updates**: WebSocket connections for live features
- **Responsive Design**: Mobile-first approach with modern UI
- **Testing**: Unit tests and E2E testing with Jest and Playwright
- **Deployment Ready**: Docker containerization with production configuration

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Radix UI**: Accessible component primitives
- **Socket.io Client**: Real-time communication

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **MongoDB**: NoSQL database with Mongoose ODM
- **Redis**: In-memory caching and session storage
- **JWT**: Secure authentication tokens
- **Cloudinary**: Media storage and optimization
- **Socket.io**: Real-time WebSocket server

### DevOps & Testing
- **Docker**: Containerization
- **Jest**: Unit testing framework
- **Playwright**: E2E testing
- **Nginx**: Reverse proxy and load balancing
- **GitHub Actions**: CI/CD pipeline

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 7.0+
- Redis 7.0+
- Cloudinary account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env-COPY-THIS.txt .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/socialmedia
   JWT_SECRET=your-jwt-secret-here
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   UPSTASH_REDIS_REST_URL=your-upstash-redis-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
   ```

4. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod
   
   # Redis
   redis-server
   ```

5. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. **Build and start services**
   ```bash
   docker-compose up -d
   ```

2. **Seed the database**
   ```bash
   docker-compose exec app npm run db:seed
   ```

3. **Access the application**
   Navigate to [http://localhost](http://localhost)

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npx playwright test --headed
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   ├── create/           # Content creation pages
│   ├── feed/             # Main feed
│   ├── profile/          # User profiles
│   ├── reels/            # Reels page
│   ├── settings/         # User settings
│   └── stories/          # Stories functionality
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat components
│   ├── layout/           # Layout components
│   ├── posts/            # Post components
│   └── ui/               # UI components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── cache-utils.ts    # Redis caching utilities
│   ├── cdn.ts            # CDN optimization
│   ├── queue.ts          # Background job queue
│   └── redis.ts          # Redis client
├── models/                # Database models
├── __tests__/            # Unit tests
├── e2e/                  # E2E tests
├── scripts/              # Database scripts
└── public/               # Static assets
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | No |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | No |

### Database Collections

- `users`: User accounts and profiles
- `posts`: User posts and content
- `stories`: 24-hour stories
- `reels`: Short-form videos
- `messages`: Chat messages
- `conversations`: Chat conversations
- `likes`: Post and reel likes
- `comments`: Post and reel comments
- `follows`: User follow relationships
- `profile_visits`: Profile visitor tracking

## 🚀 Deployment

### Production Deployment

1. **Set up production environment variables**
2. **Build the application**
   ```bash
   npm run build
   ```
3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Deployment

1. **Configure environment variables in docker-compose.yml**
2. **Build and deploy**
   ```bash
   docker-compose up -d
   ```

### Cloud Deployment

The application is ready for deployment on:
- **Vercel**: Zero-config deployment
- **AWS**: EC2, ECS, or Lambda
- **Google Cloud**: Cloud Run or Compute Engine
- **Azure**: Container Instances or App Service

## 📊 Performance Features

- **Redis Caching**: Reduces database load and improves response times
- **CDN Integration**: Optimized media delivery with automatic format conversion
- **Background Jobs**: Offloads heavy processing tasks
- **Image Optimization**: Automatic image compression and format optimization
- **Lazy Loading**: Efficient resource loading
- **Database Indexing**: Optimized queries for better performance

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Proper cross-origin resource sharing
- **Security Headers**: HTTP security headers
- **Password Hashing**: bcrypt password hashing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the flexible database
- Cloudinary for media optimization
- Redis for high-performance caching
- All open-source contributors

## 📞 Support

For support, email support@example.com or create an issue in the repository.

---

**Built with ❤️ by the development team**