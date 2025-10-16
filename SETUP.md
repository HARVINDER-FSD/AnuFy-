# Social Media App Setup Guide

## Prerequisites
This app requires cloud services to function properly. Follow these steps:

## 1. Required Integrations
Set up these integrations in your Vercel project:

### Database (Choose one):
- **Neon PostgreSQL** (Recommended)
- **Supabase** (Alternative)

### Storage:
- **Vercel Blob** (Required for media uploads)

### Caching:
- **Upstash Redis** (Required for sessions and caching)

## 2. Environment Variables
After setting up integrations, add these environment variables:

\`\`\`env
# Database (automatically set by Neon integration)
DATABASE_URL=

# Redis (automatically set by Upstash integration)  
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Blob Storage (automatically set by Vercel Blob integration)
BLOB_READ_WRITE_TOKEN=

# JWT Secrets (generate random strings)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## 3. Database Setup
Run the database migration scripts in the `/scripts` folder to create the required tables.

## 4. Development
\`\`\`bash
npm install
npm run dev
\`\`\`

## 5. Deployment
The app is configured for Vercel deployment with serverless functions.
