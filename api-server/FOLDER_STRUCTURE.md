# API Server Folder Structure

## Overview

The api-server follows a clean, modular architecture with clear separation of concerns.

## Directory Structure

```
api-server/
├── src/
│   ├── routes/          # API route handlers
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   ├── reels.ts
│   │   ├── stories.ts
│   │   ├── notifications.ts
│   │   ├── chat.ts
│   │   ├── upload.ts
│   │   ├── feed.ts
│   │   ├── explore.ts
│   │   ├── reports.ts
│   │   ├── search.ts
│   │   ├── analytics.ts
│   │   └── bookmarks.ts
│   │
│   ├── services/        # Business logic layer
│   │   ├── post.ts
│   │   ├── reel.ts
│   │   ├── story.ts
│   │   ├── notification.ts
│   │   ├── comment.ts
│   │   ├── chat.ts
│   │   ├── user.ts
│   │   └── auth.ts
│   │
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication & authorization
│   │   ├── upload.ts    # File upload handling
│   │   └── validation.ts # Request validation
│   │
│   ├── models/          # Database models/schemas
│   │   ├── user.ts
│   │   ├── post.ts
│   │   ├── reel.ts
│   │   ├── story.ts
│   │   ├── notification.ts
│   │   ├── comment.ts
│   │   ├── bookmark.ts
│   │   └── report.ts
│   │
│   ├── lib/             # Utility libraries
│   │   ├── database.ts  # Database connection
│   │   ├── storage.ts   # File storage (S3/Cloudinary)
│   │   ├── cache.ts     # Redis caching
│   │   └── queue.ts     # Job queue (Bull/BullMQ)
│   │
│   ├── config/          # Configuration files
│   │   ├── database.ts
│   │   ├── storage.ts
│   │   └── redis.ts
│   │
│   ├── utils/           # Helper functions
│   │   ├── errors.ts    # Error handling
│   │   ├── validation.ts # Validation helpers
│   │   └── pagination.ts # Pagination helpers
│   │
│   ├── types/           # TypeScript type definitions
│   │   ├── express.d.ts # Express type extensions
│   │   ├── models.ts    # Model types
│   │   └── api.ts       # API request/response types
│   │
│   └── index.ts         # Main server entry point
│
├── tests/               # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── vercel.json          # Deployment configuration
```

## Layer Responsibilities

### 1. Routes Layer (`src/routes/`)
- Handle HTTP requests and responses
- Route parameter validation
- Call appropriate service methods
- Return formatted responses
- **No business logic**

### 2. Services Layer (`src/services/`)
- Contain all business logic
- Data validation and transformation
- Database operations
- External API calls
- Cache management
- **Reusable across different routes**

### 3. Middleware Layer (`src/middleware/`)
- Authentication & authorization
- Request validation
- File upload handling
- Rate limiting
- Error handling
- Logging

### 4. Models Layer (`src/models/`)
- Database schema definitions
- Model methods and statics
- Virtual properties
- Hooks and middleware

### 5. Lib Layer (`src/lib/`)
- Database connection management
- External service integrations
- Caching utilities
- Queue management
- Third-party SDK wrappers

### 6. Config Layer (`src/config/`)
- Environment-specific configurations
- Database connection settings
- API keys and secrets
- Feature flags

### 7. Utils Layer (`src/utils/`)
- Pure utility functions
- Helper methods
- Common algorithms
- Format converters

### 8. Types Layer (`src/types/`)
- TypeScript type definitions
- Interface declarations
- Type guards
- Custom type utilities

## File Naming Conventions

- **Routes**: `kebab-case.ts` (e.g., `user-profile.ts`)
- **Services**: `camelCase.ts` (e.g., `userService.ts`)
- **Models**: `PascalCase.ts` (e.g., `User.ts`)
- **Utilities**: `camelCase.ts` (e.g., `dateUtils.ts`)
- **Types**: `camelCase.ts` or `PascalCase.ts`

## Import Patterns

### Absolute Imports (Recommended)
```typescript
import { UserService } from '@/services/user'
import { authenticateToken } from '@/middleware/auth'
import { User } from '@/models/User'
```

### Relative Imports
```typescript
import { UserService } from '../services/user'
import { authenticateToken } from '../middleware/auth'
```

## Code Organization Best Practices

### 1. Single Responsibility
Each file should have one clear purpose.

### 2. Dependency Injection
Services should not directly instantiate dependencies.

### 3. Error Handling
Use consistent error handling patterns across all layers.

### 4. Async/Await
Prefer async/await over callbacks and promises.

### 5. Type Safety
Leverage TypeScript for type safety throughout.

## Example Flow

```
Request → Route → Middleware → Service → Model → Database
                                    ↓
                                  Cache
                                    ↓
Response ← Route ← Service ← Model ← Database
```

## Environment Variables

Create a `.env` file in the api-server root:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
MONGODB_URI=mongodb://localhost:27017/anufy

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Storage
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=your-bucket

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

## API Documentation

API documentation is available at:
- Development: http://localhost:3001/api-docs
- Production: https://api.yourdomain.com/api-docs

## Deployment

The api-server can be deployed to:
- **Vercel** (serverless)
- **AWS EC2** (traditional server)
- **Docker** (containerized)
- **Kubernetes** (orchestrated)

See deployment guides in `/docs/deployment/`

## Contributing

1. Follow the folder structure
2. Write tests for new features
3. Update documentation
4. Follow code style guidelines
5. Create meaningful commit messages

## Additional Resources

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Testing Guide](./docs/TESTING.md)
