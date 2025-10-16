# Quick Start Guide - Social Media App

This guide will help you get the application up and running quickly.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (we recommend [Neon](https://neon.tech) for serverless PostgreSQL)
- Redis instance (we recommend [Upstash](https://upstash.com) for serverless Redis)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

1. Copy the `env.example.txt` file contents
2. Create a `.env.local` file in the root directory
3. Fill in your actual values:

### Required Variables (Minimum to run the app):

```env
# Database - Get from Neon (https://neon.tech)
DATABASE_URL=postgresql://username:password@your-neon-host.neon.tech/dbname?sslmode=require

# JWT Secret - Generate a random string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Redis - Get from Upstash (https://upstash.com)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

### Optional Variables (for full functionality):

```env
# Cloudinary for image/video uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset

# Vercel Blob for file storage
BLOB_READ_WRITE_TOKEN=your-blob-token
```

## Step 3: Set Up the Database

### Option A: Using Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Run the database schema:

```bash
# Connect to your Neon database using psql or their web SQL editor
# Copy and paste the contents of database-schema.sql
```

Or use the Neon SQL Editor in their dashboard:
- Open your project
- Go to "SQL Editor"
- Copy the entire contents of `database-schema.sql`
- Paste and run it

### Option B: Using Local PostgreSQL

```bash
# Create database
createdb socialmedia

# Run schema
psql socialmedia < database-schema.sql
```

## Step 4: Set Up Redis (Optional but Recommended)

1. Go to [upstash.com](https://upstash.com) and create a free account
2. Create a new Redis database
3. Copy the REST URL and Token
4. Add them to your `.env.local` file

**Note:** The app will work without Redis, but caching and session management will be limited.

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Create Your First Account

1. Click "Sign up" on the login page
2. Enter your username, email, and password
3. Click "Create Account"
4. You'll be automatically logged in and redirected to the feed

## Troubleshooting

### Database Connection Issues

- Make sure your `DATABASE_URL` is correct
- Check that your IP is allowed in Neon's connection settings
- Verify SSL mode is set to `require` for Neon

### Redis Connection Issues

- Verify your Upstash credentials are correct
- The app will continue to work without Redis, but with limited caching

### Build Errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### Port Already in Use

```bash
# Kill the process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

## Testing the App

### Create Test Users

You can create multiple accounts to test the social features:

1. Register user 1: `user1@test.com`
2. Open an incognito window
3. Register user 2: `user2@test.com`
4. Test following, posting, and messaging between accounts

### Test Features

- ✅ **Authentication**: Login/Register/Logout
- ✅ **Posts**: Create, like, comment
- ✅ **Stories**: Create and view stories (24-hour expiry)
- ✅ **Reels**: Upload and view short videos
- ✅ **Messages**: Direct messaging
- ✅ **Notifications**: Real-time notifications
- ✅ **Profile**: View and edit profile
- ✅ **Search**: Find users and content
- ✅ **Follow**: Follow/unfollow users

## Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

Vercel will automatically:
- Build your Next.js app
- Set up serverless functions
- Provide a production URL
- Enable automatic deployments on push

## Next Steps

- Customize the branding (logo, colors, name)
- Add more features (groups, live streaming, etc.)
- Set up analytics and monitoring
- Configure content moderation
- Add email notifications
- Implement push notifications

## Support

For issues or questions:
- Check the `README.md` for detailed documentation
- Review the `database-schema.sql` for database structure
- Check the API routes in `app/api/` for backend logic

## Security Notes

⚠️ **Important for Production:**

1. Change the `JWT_SECRET` to a strong random string
2. Enable rate limiting on API routes
3. Set up proper CORS policies
4. Use environment variables for all secrets
5. Enable HTTPS only
6. Set up database backups
7. Implement proper error logging
8. Add content moderation
9. Set up monitoring and alerts

---

**Happy coding! 🚀**
