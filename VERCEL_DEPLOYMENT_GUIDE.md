# 🚀 Vercel Deployment Guide

## ✅ Issues Fixed

### 1. **MongoDB Connection Leaks** (CRITICAL)
- ✅ Added `try-finally` blocks to ensure connections close properly
- ✅ Prevents serverless function timeouts and memory leaks
- ✅ Proper connection management for both login and register routes

### 2. **Async Cookies API** (CRITICAL)
- ✅ Updated `cookies()` to be awaited (Next.js 15+ compatibility)
- ✅ Added `secure` flag for production environments
- ✅ Prevents runtime errors on Vercel

### 3. **Environment Variables** (SECURITY)
- ✅ Removed hardcoded fallback values
- ✅ Proper validation for missing env vars
- ✅ Added JWT_SECRET validation

---

## 📋 Pre-Deployment Checklist

### Required Environment Variables

You **MUST** set these in Vercel Dashboard:

1. **MONGODB_URI** - Your MongoDB connection string
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dbname
   ```

2. **JWT_SECRET** - Secret key for JWT tokens (generate a strong random string)
   ```
   openssl rand -base64 32
   ```

3. **NEXTAUTH_SECRET** - Secret for NextAuth (if using)
   ```
   openssl rand -base64 32
   ```

4. **NEXTAUTH_URL** - Your production URL
   ```
   https://your-app.vercel.app
   ```

---

## 🔧 Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub (Recommended)

1. **Push to GitHub** (Already done ✅)
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository: `HARVINDER-FSD/AnuFy-`
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add all required variables listed above
   - Make sure to add them for **Production**, **Preview**, and **Development**

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

---

## 🔍 Post-Deployment Verification

### Test Your Endpoints

1. **Register Endpoint**
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","name":"Test User","email":"test@example.com","password":"password123"}'
   ```

2. **Login Endpoint**
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

### Check Logs
- Go to Vercel Dashboard → Your Project → Deployments
- Click on latest deployment → "Functions" tab
- Check logs for any errors

---

## ⚠️ Common Issues & Solutions

### Issue: "Database configuration error"
**Solution**: Ensure `MONGODB_URI` is set in Vercel environment variables

### Issue: "Server configuration error"
**Solution**: Ensure `JWT_SECRET` is set in Vercel environment variables

### Issue: Function timeout
**Solution**: 
- Check MongoDB connection string is correct
- Ensure MongoDB Atlas allows connections from `0.0.0.0/0` (or Vercel IPs)
- Verify network access in MongoDB Atlas

### Issue: CORS errors
**Solution**: Already handled in the code with proper CORS headers

---

## 🎯 MongoDB Atlas Configuration

1. **Whitelist Vercel IPs**
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Add `0.0.0.0/0` (allow from anywhere) OR specific Vercel IPs

2. **Get Connection String**
   - Go to MongoDB Atlas → Clusters → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Use this as `MONGODB_URI` in Vercel

---

## 📊 Performance Optimizations Applied

- ✅ Connection pooling via MongoDB driver
- ✅ 5-second timeout for database operations
- ✅ Proper connection cleanup in `finally` blocks
- ✅ Serverless function optimization (10s max duration)

---

## 🔐 Security Best Practices Applied

- ✅ No hardcoded secrets
- ✅ Environment variable validation
- ✅ Secure cookies in production
- ✅ Password hashing with bcrypt
- ✅ JWT token expiration (7 days)
- ✅ HttpOnly cookies for sensitive tokens

---

## 📝 Next Steps After Deployment

1. Test all authentication flows
2. Monitor function logs for errors
3. Set up custom domain (optional)
4. Configure analytics (optional)
5. Set up monitoring/alerts

---

## 🆘 Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)

---

**Your app is now ready for Vercel deployment! 🎉**
