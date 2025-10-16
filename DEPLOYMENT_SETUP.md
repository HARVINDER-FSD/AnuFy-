# Deployment Setup Guide

## ⚠️ IMPORTANT: Required Environment Variables

Your app is deployed but **authentication won't work** without setting up these environment variables in Vercel.

### 1. MongoDB Atlas Setup (REQUIRED)

Your app uses MongoDB for authentication and data storage. You need a cloud MongoDB instance:

1. **Go to MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
2. **Create a free account** (if you don't have one)
3. **Create a free cluster** (M0 Sandbox - Free forever)
4. **Create a database user**:
   - Go to Database Access
   - Add New Database User
   - Choose Password authentication
   - Save username and password
5. **Whitelist all IPs** (for Vercel):
   - Go to Network Access
   - Add IP Address
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
6. **Get your connection string**:
   - Go to Database → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `socialmedia`

Example: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/socialmedia?retryWrites=true&w=majority`

### 2. Add Environment Variables to Vercel

Go to your Vercel project settings:

1. **Navigate to**: https://vercel.com/your-username/your-project/settings/environment-variables
2. **Add these variables**:

```
MONGODB_URI=mongodb+srv://your_username:your_password@your-cluster.mongodb.net/socialmedia?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_key_here_make_it_long_and_secure
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Redeploy

After adding environment variables:
- Go to Deployments tab
- Click the three dots on the latest deployment
- Click "Redeploy"

OR simply push a new commit to trigger a deployment.

## Optional Environment Variables

```
DATABASE_URL=postgresql://... (if using PostgreSQL for additional features)
UPSTASH_REDIS_REST_URL=https://... (for caching)
UPSTASH_REDIS_REST_TOKEN=... (for caching)
OPENAI_API_KEY=sk-... (for content moderation)
```

## Testing Authentication

Once deployed with proper environment variables:

1. Go to your deployed app
2. Click "Register" 
3. Create a new account
4. You should be able to login successfully

## Troubleshooting

- **"Cannot connect to database"**: Check your MongoDB URI and ensure IP whitelist includes 0.0.0.0/0
- **"Invalid credentials"**: Make sure you've created at least one user account via registration
- **"JWT error"**: Ensure JWT_SECRET is set in Vercel environment variables

## Need Help?

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
