# 🚀 Deploy to Vercel - Complete Guide

## 📋 Pre-Deployment Checklist

Before pushing to GitHub:

- [ ] `.env` file is in `.gitignore` (never commit secrets!)
- [ ] All features tested locally
- [ ] No console errors
- [ ] Firebase chat working
- [ ] MongoDB connected
- [ ] Cloudinary working

---

## 🔐 Step 1: Secure Your Secrets (IMPORTANT!)

### Check `.gitignore` includes:

```
.env
.env.local
.env*.local
node_modules/
.next/
out/
dist/
```

### Verify `.env` is NOT tracked:

```bash
git status
# Should NOT show .env file
```

If `.env` appears, remove it:

```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## 📦 Step 2: Push to GitHub

### If you don't have a Git repo yet:

```bash
# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Anufy social media app with Firebase chat"

# Create repo on GitHub (go to github.com/new)
# Then connect:
git remote add origin https://github.com/YOUR_USERNAME/anufy.git
git branch -M main
git push -u origin main
```

### If you already have a Git repo:

```bash
# Add new files
git add .

# Commit changes
git commit -m "Add Firebase real-time chat and Capacitor notifications"

# Push to GitHub
git push origin main
```

---

## 🌐 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (leave default)
   - Output Directory: `.next` (leave default)

4. **Add Environment Variables:**
   Click "Environment Variables" and add:

   ```
   MONGODB_URI=mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0
   
   JWT_SECRET=4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192
   
   CLOUDINARY_CLOUD_NAME=dcm470yhl
   CLOUDINARY_API_KEY=832377464323471
   CLOUDINARY_API_SECRET=RV8uRIhI2IL5eyl6InvU5s8OX2g
   CLOUDINARY_UPLOAD_PRESET=profilePicsUnsigned
   CLOUDINARY_DEFAULT_FOLDER=uploads
   
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDB3JvWMThk_5EYmb4IWh54e60Ra_L2Dxc
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=application-ed096.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=application-ed096
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=application-ed096.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=274507213799
   NEXT_PUBLIC_FIREBASE_APP_ID=1:274507213799:web:b7c988759eb02749ba2b42
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ECBK3VBNRT
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? anufy
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## 🔧 Step 4: Configure Vercel Settings

### 1. Add Environment Variables (if not done)

Go to: `Project Settings` → `Environment Variables`

Add all variables from your `.env` file.

### 2. Configure Domains (Optional)

Go to: `Project Settings` → `Domains`

Add custom domain:
- `anufy.com`
- `www.anufy.com`

### 3. Enable Auto-Deploy

Go to: `Project Settings` → `Git`

Enable:
- ✅ Production Branch: `main`
- ✅ Auto-deploy on push

Now every push to `main` auto-deploys!

---

## 🔥 Step 5: Update Firebase for Production

### 1. Add Vercel Domain to Firebase

1. Go to Firebase Console
2. Project Settings → Authorized domains
3. Add your Vercel domain:
   - `your-app.vercel.app`
   - `anufy.com` (if using custom domain)

### 2. Update Firestore Rules (if needed)

Already done! Your rules allow authenticated users.

### 3. Update Storage Rules (if needed)

Already done! Your rules allow authenticated uploads.

---

## ✅ Step 6: Test Your Deployment

### 1. Visit Your Site

```
https://your-app.vercel.app
```

### 2. Test Features

- [ ] Login works
- [ ] Posts load
- [ ] Reels play
- [ ] Stories work
- [ ] Chat works (real-time!)
- [ ] Notifications appear
- [ ] Images upload
- [ ] Firebase connected

### 3. Check Logs

Go to: `Deployments` → Click latest → `Functions`

Check for errors.

---

## 🐛 Troubleshooting

### "Module not found" Error

**Fix:** Install missing dependencies

```bash
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### "Environment variable not found"

**Fix:** Add to Vercel dashboard

1. Go to Project Settings → Environment Variables
2. Add missing variable
3. Redeploy: Deployments → Click "..." → Redeploy

### Firebase not connecting

**Fix:** Check Firebase config

1. Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
2. Check Firebase Console → Authorized domains
3. Add your Vercel domain

### MongoDB connection failed

**Fix:** Whitelist Vercel IPs

1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Save

### Images not uploading

**Fix:** Check Cloudinary config

1. Verify all `CLOUDINARY_*` variables are set
2. Check Cloudinary dashboard for errors
3. Verify upload preset exists

---

## 🔄 Continuous Deployment

### Auto-Deploy on Push

Every time you push to GitHub:

```bash
git add .
git commit -m "Add new feature"
git push
```

Vercel automatically:
1. Detects push
2. Builds your app
3. Runs tests
4. Deploys to production
5. Sends you notification

### Preview Deployments

Every pull request gets a preview URL:

```bash
git checkout -b new-feature
# Make changes
git push origin new-feature
# Create PR on GitHub
# Vercel creates preview: https://anufy-git-new-feature.vercel.app
```

---

## 📊 Monitor Your App

### Vercel Analytics

Go to: `Analytics` tab

See:
- Page views
- Unique visitors
- Top pages
- Performance metrics

### Vercel Logs

Go to: `Deployments` → Click deployment → `Functions`

See:
- API logs
- Errors
- Performance

### Firebase Console

Monitor:
- Firestore reads/writes
- Storage usage
- Active users

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Firebase authorized domains updated
- [ ] MongoDB IP whitelist configured
- [ ] Cloudinary working
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] All features tested on production
- [ ] Error monitoring set up
- [ ] Analytics enabled

---

## 🚀 Quick Commands Reference

```bash
# Push to GitHub
git add .
git commit -m "Your message"
git push

# Deploy to Vercel (CLI)
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Open project in browser
vercel open
```

---

## 📱 Next Steps

### 1. Set Up Custom Domain

1. Buy domain (Namecheap, GoDaddy, etc.)
2. Add to Vercel: Project Settings → Domains
3. Update DNS records (Vercel provides instructions)
4. Wait for SSL certificate (automatic)

### 2. Enable Analytics

```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 3. Set Up Error Monitoring

Use Sentry or similar:

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 4. Optimize Performance

- Enable Vercel Edge Functions
- Use Vercel Image Optimization
- Enable caching headers

---

## 🎉 You're Live!

Your app is now deployed and accessible worldwide!

**Share your app:**
- `https://your-app.vercel.app`
- Or your custom domain

**Monitor:**
- Vercel Dashboard: https://vercel.com/dashboard
- Firebase Console: https://console.firebase.google.com
- MongoDB Atlas: https://cloud.mongodb.com

**Update:**
Just push to GitHub and Vercel auto-deploys!

---

## 💡 Pro Tips

1. **Use Preview Deployments**
   - Test features before production
   - Share with team for review

2. **Monitor Performance**
   - Check Vercel Analytics
   - Optimize slow pages

3. **Set Up Alerts**
   - Get notified of deployment failures
   - Monitor error rates

4. **Use Environment Variables**
   - Different configs for dev/prod
   - Never commit secrets

5. **Enable Auto-Deploy**
   - Push to deploy
   - No manual steps

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **MongoDB Docs:** https://docs.mongodb.com

---

## 🎊 Congratulations!

Your Anufy social media app is now live on Vercel with:
- ✅ Real-time Firebase chat
- ✅ MongoDB database
- ✅ Cloudinary media storage
- ✅ Push notifications
- ✅ Auto-deployment
- ✅ SSL certificate
- ✅ Global CDN

**Your app is production-ready!** 🚀
