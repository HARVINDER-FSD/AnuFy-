# Frontend Folder Structure

## Overview

This is a Next.js 14+ application using the App Router, TypeScript, and Tailwind CSS for the Anufy social media platform.

## Directory Structure

```
frontend/ (root)
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   │   ├── login/
│   │   └── register/
│   │
│   ├── api/               # API routes (to be removed/deprecated)
│   │   ├── auth/
│   │   ├── posts/
│   │   ├── reels/
│   │   ├── stories/
│   │   ├── notifications/
│   │   ├── messages/
│   │   ├── users/
│   │   ├── upload/
│   │   ├── analytics/
│   │   ├── search/
│   │   ├── reports/
│   │   ├── spotify/
│   │   ├── music/
│   │   └── explore/
│   │
│   ├── feed/              # Home feed page
│   ├── profile/           # User profile pages
│   │   └── [username]/
│   ├── reels/             # Reels feed
│   ├── stories/           # Stories viewer & creator
│   │   └── create/
│   ├── create/            # Content creation
│   │   ├── post/
│   │   └── reel/
│   ├── messages/          # Chat/messaging
│   ├── search/            # Search page
│   ├── hashtag/           # Hashtag pages
│   │   └── [tag]/
│   ├── settings/          # User settings
│   │   ├── blocked/
│   │   └── delete/
│   │
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── loading.tsx        # Loading states
│
├── components/            # React components
│   ├── auth/             # Authentication components
│   │   └── auth-provider.tsx
│   │
│   ├── layout/           # Layout components
│   │   ├── app-header.tsx
│   │   ├── app-layout.tsx
│   │   └── mobile-nav.tsx
│   │
│   ├── posts/            # Post components
│   │   ├── post-card.tsx
│   │   ├── post-card-simple.tsx
│   │   └── post-detail-modal.tsx
│   │
│   ├── reels/            # Reel components
│   │   └── reel-player.tsx
│   │
│   ├── stories/          # Story components
│   │   ├── story-viewer.tsx
│   │   ├── stories-bar.tsx
│   │   ├── AdvancedStickers.tsx
│   │   ├── media-music-editor.tsx
│   │   ├── instagram-reels-music-flow.tsx
│   │   ├── spotify-full-song-player.tsx
│   │   ├── instagram-music-trimmer.tsx
│   │   ├── advanced-music-editor.tsx
│   │   └── music-story-editor.tsx
│   │
│   ├── chat/             # Chat components
│   │   ├── chat-list.tsx
│   │   ├── chat-window.tsx
│   │   ├── message-bubble.tsx
│   │   ├── simple-chat.tsx
│   │   ├── instagram-style-chat.tsx
│   │   ├── firebase-chat.tsx
│   │   └── firebase-chat-list.tsx
│   │
│   ├── notifications/    # Notification components
│   │   ├── notification-dropdown.tsx
│   │   ├── notification-manager.tsx
│   │   └── notification-popup.tsx
│   │
│   ├── profile/          # Profile components
│   │   ├── content-grid.tsx
│   │   ├── post-detail-modal.tsx
│   │   └── instagram-post-modal.tsx
│   │
│   ├── moderation/       # Moderation components
│   │   └── report-modal.tsx
│   │
│   ├── share/            # Share components
│   │   └── share-modal.tsx
│   │
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   ├── slider.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   └── toast.tsx
│   │
│   ├── splash-screen.tsx
│   ├── loading-bar.tsx
│   ├── skeleton-loader.tsx
│   └── prefetch-links.tsx
│
├── hooks/                # Custom React hooks
│   ├── use-posts.ts
│   ├── use-chat-notifications.ts
│   └── use-*.ts
│
├── lib/                  # Utility libraries
│   ├── api-config.ts     # API configuration
│   ├── mongodb.ts        # MongoDB connection
│   ├── firebase-config.ts # Firebase config
│   ├── firebase-chat.ts  # Firebase chat utilities
│   ├── cloudinary-upload.ts # Cloudinary integration
│   ├── spotify-player.ts # Spotify integration
│   ├── spotify-auth.ts
│   ├── mongo-auth.ts     # MongoDB auth
│   ├── color-extractor.ts
│   ├── emoji-mapping.ts
│   ├── instant-cache.ts  # Caching utilities
│   ├── instant-loading.ts
│   ├── instant-navigation.ts
│   ├── ultra-instant.ts
│   ├── notification-service.ts
│   └── polling-notifications.ts
│
├── models/               # Database models (MongoDB)
│   ├── bookmark.ts
│   ├── notification.ts
│   ├── report.ts
│   └── search-history.ts
│
├── services/             # Business logic (deprecated - moved to api-server)
│   ├── post.ts
│   ├── reel.ts
│   ├── story.ts
│   ├── notification.ts
│   └── comment.ts
│
├── middleware/           # Middleware (deprecated - moved to api-server)
│   ├── auth.ts
│   └── upload.ts
│
├── controllers/          # Controllers (deprecated - moved to api-server)
│   └── userController.ts
│
├── routes/               # Express routes (deprecated - moved to api-server)
│   ├── users.ts
│   ├── stories.ts
│   └── reels.ts
│
├── public/               # Static assets
│   ├── anufy-logo.svg
│   ├── anufy-icon.svg
│   └── anufy-splash-logo.svg
│
├── scripts/              # Utility scripts
│   ├── seed.js
│   ├── check-likes.js
│   └── clear-likes.js
│
├── styles/               # Additional styles (if any)
│
├── __tests__/            # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env                  # Environment variables
├── .env.example          # Environment template
├── .gitignore
├── next.config.mjs       # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies
├── components.json       # shadcn/ui config
├── middleware.ts         # Next.js middleware
└── README.md             # Documentation
```

## Layer Responsibilities

### 1. App Directory (`app/`)
Next.js 14+ App Router structure:
- **Pages**: Each folder represents a route
- **Layouts**: Shared layouts for route groups
- **Loading**: Loading states for routes
- **Error**: Error boundaries
- **API Routes**: Server-side API endpoints (being deprecated)

### 2. Components (`components/`)
Reusable React components organized by feature:
- **Feature-based**: Grouped by domain (auth, posts, reels, etc.)
- **UI Components**: Reusable primitives (buttons, inputs, etc.)
- **Layout Components**: App structure (header, nav, etc.)

### 3. Hooks (`hooks/`)
Custom React hooks for:
- Data fetching
- State management
- Side effects
- Reusable logic

### 4. Lib (`lib/`)
Utility functions and integrations:
- API clients
- Database connections
- Third-party integrations
- Helper functions

### 5. Models (`models/`)
MongoDB/Mongoose schemas:
- Data structure definitions
- Validation rules
- Model methods

### 6. Public (`public/`)
Static assets:
- Images
- Icons
- Fonts
- Other static files

## File Naming Conventions

### Components
- **React Components**: `kebab-case.tsx` (e.g., `post-card.tsx`)
- **UI Components**: `kebab-case.tsx` (e.g., `button.tsx`)

### Pages (App Router)
- **Routes**: `page.tsx` (e.g., `app/feed/page.tsx`)
- **Layouts**: `layout.tsx`
- **Loading**: `loading.tsx`
- **Error**: `error.tsx`

### Utilities
- **Hooks**: `use-*.ts` (e.g., `use-posts.ts`)
- **Libs**: `kebab-case.ts` (e.g., `api-config.ts`)
- **Models**: `kebab-case.ts` (e.g., `user-model.ts`)

## Import Patterns

### Absolute Imports
```typescript
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { apiClient } from '@/lib/api-config'
```

### Relative Imports
```typescript
import { PostCard } from '../components/posts/post-card'
import { formatDate } from './utils'
```

## Component Organization

### Feature-based Structure
```
components/
├── posts/
│   ├── post-card.tsx          # Main post card
│   ├── post-detail-modal.tsx  # Post detail view
│   ├── post-actions.tsx       # Like, comment, share
│   └── post-comments.tsx      # Comments section
```

### UI Components (shadcn/ui)
```
components/ui/
├── button.tsx
├── input.tsx
├── dialog.tsx
└── ...
```

## App Router Structure

### Route Groups
```
app/
├── (auth)/              # Auth pages (no layout)
│   ├── login/
│   └── register/
│
├── (main)/              # Main app (with layout)
│   ├── feed/
│   ├── profile/
│   └── ...
```

### Dynamic Routes
```
app/
├── profile/[username]/page.tsx
├── hashtag/[tag]/page.tsx
└── posts/[postId]/page.tsx
```

### API Routes (Deprecated)
```
app/api/
├── posts/route.ts
├── users/route.ts
└── ...
```
**Note**: These are being moved to the standalone api-server.

## State Management

### Client State
- React hooks (useState, useReducer)
- Context API for global state
- Zustand (if needed)

### Server State
- React Query / SWR for data fetching
- Server Components for initial data
- API routes for mutations

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom theme in `tailwind.config.ts`
- Global styles in `app/globals.css`

### Component Styles
```typescript
// Inline Tailwind classes
<div className="flex items-center gap-4 p-4">
  <Button className="bg-blue-500 hover:bg-blue-600">
    Click me
  </Button>
</div>
```

## Data Fetching

### Server Components (Recommended)
```typescript
// app/feed/page.tsx
async function FeedPage() {
  const posts = await fetch('http://localhost:3001/api/posts/feed')
  return <PostList posts={posts} />
}
```

### Client Components
```typescript
'use client'

import { useEffect, useState } from 'react'

function PostList() {
  const [posts, setPosts] = useState([])
  
  useEffect(() => {
    fetch('http://localhost:3001/api/posts/feed')
      .then(res => res.json())
      .then(data => setPosts(data))
  }, [])
  
  return <div>{/* render posts */}</div>
}
```

## Environment Variables

### Required Variables
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Database
MONGODB_URI=mongodb://localhost:27017/anufy

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Spotify
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-secret
```

## Development Workflow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Start API Server
```bash
cd api-server
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Build & Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
```bash
vercel deploy
```

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## Code Quality

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## Best Practices

### 1. Component Structure
- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic into hooks

### 2. Performance
- Use Server Components when possible
- Lazy load heavy components
- Optimize images with next/image
- Implement proper caching

### 3. Type Safety
- Use TypeScript for all files
- Define proper interfaces
- Avoid `any` type

### 4. Accessibility
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### 5. Security
- Validate user input
- Sanitize data
- Use environment variables for secrets
- Implement proper authentication

## Migration Notes

### API Routes → API Server
The `app/api/` directory is being deprecated. All API logic is moving to the standalone `api-server/` directory.

**Before:**
```typescript
// app/api/posts/route.ts
export async function GET() {
  // API logic here
}
```

**After:**
```typescript
// Frontend: Call external API
const response = await fetch('http://localhost:3001/api/posts')
```

### Services → API Server
Business logic in `services/` is moving to `api-server/src/services/`.

### Middleware → API Server
Express middleware in `middleware/` is moving to `api-server/src/middleware/`.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [shadcn/ui](https://ui.shadcn.com)

## Contributing

1. Follow the folder structure
2. Use TypeScript for all new files
3. Write tests for new features
4. Follow naming conventions
5. Update documentation

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Status**: Active Development
