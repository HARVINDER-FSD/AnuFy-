# Server Setup Guide - Instagram Modal with API

## 🚀 Quick Start

### Option 1: Run TypeScript Server (Recommended)
```bash
npm run dev:server
```

This runs the TypeScript server with hot reload using `tsx`.

### Option 2: Run JavaScript Server
```bash
npm run server
```

This runs the original JavaScript server (limited functionality).

### Option 3: Run Both Next.js and API Server
```bash
# Terminal 1 - Next.js Frontend
npm run dev

# Terminal 2 - API Server
npm run dev:server
```

## 📁 Server Files

### TypeScript Server (NEW)
- **File**: `server.ts`
- **Features**: Full TypeScript support, all routes working
- **Routes**:
  - `/api/auth` - Authentication
  - `/api/users` - User management
  - `/api/posts` - Posts with comments, likes, save
  - `/api/reels` - Reels with comments, likes, save
  - `/api/stories` - Stories
  - `/api/search` - Search functionality

### JavaScript Server (OLD)
- **File**: `server.js`
- **Features**: Basic functionality
- **Note**: Limited route support

## 🔌 API Endpoints for Instagram Modal

### Posts
```
GET    /api/posts/:id                 - Get post details
GET    /api/posts/:id/comments        - Get comments
POST   /api/posts/:id/comments        - Add comment
GET    /api/posts/:id/likes           - Get likes list
POST   /api/posts/:id/like            - Like post
DELETE /api/posts/:id/like            - Unlike post
POST   /api/posts/:id/save            - Save post
DELETE /api/posts/:id/save            - Unsave post
DELETE /api/posts/:id                 - Delete post
```

### Reels
```
GET    /api/reels/:id                 - Get reel details
GET    /api/reels/:id/comments        - Get comments
POST   /api/reels/:id/comments        - Add comment
GET    /api/reels/:id/likes           - Get likes list
POST   /api/reels/:id/like            - Like reel
DELETE /api/reels/:id/like            - Unlike reel
POST   /api/reels/:id/save            - Save reel
DELETE /api/reels/:id/save            - Unsave reel
DELETE /api/reels/:id                 - Delete reel
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/socialmedia
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### MongoDB Connection
Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

## 🐛 Troubleshooting

### Issue: 404 Errors on API Calls
**Solution**: Make sure you're running the TypeScript server:
```bash
npm run dev:server
```

### Issue: Cannot find module errors
**Solution**: Install dependencies:
```bash
npm install
```

### Issue: TypeScript errors
**Solution**: Check tsconfig.json and ensure all types are correct

### Issue: MongoDB connection error
**Solution**: 
1. Check if MongoDB is running
2. Verify MONGODB_URI in .env
3. Check MongoDB logs

### Issue: Port already in use
**Solution**: 
1. Kill the process using port 5000
2. Or change PORT in .env

## 📊 Server Status Check

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Test API Endpoint
```bash
# Test posts endpoint
curl http://localhost:5000/api/posts

# Test reels endpoint
curl http://localhost:5000/api/reels
```

## 🔄 Development Workflow

### 1. Start MongoDB
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### 2. Start API Server
```bash
npm run dev:server
```

### 3. Start Next.js (in another terminal)
```bash
npm run dev
```

### 4. Open Browser
```
http://localhost:3000
```

## 📝 Server Logs

### TypeScript Server
```
Connected to MongoDB
Server running on port 5000
```

### API Request Logs
```
GET /api/posts/123/comments 200 45ms
POST /api/posts/123/like 200 23ms
GET /api/posts/123/likes 200 67ms
```

## 🚨 Common Errors

### Error: "Cannot find module './routes/posts'"
**Fix**: Make sure server.ts is being used, not server.js

### Error: "EADDRINUSE: address already in use"
**Fix**: 
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Error: "MongooseServerSelectionError"
**Fix**: 
1. Start MongoDB service
2. Check connection string
3. Verify MongoDB is accessible

## 🎯 Production Deployment

### Build TypeScript
```bash
npx tsc server.ts
```

### Run Production Server
```bash
NODE_ENV=production node server.js
```

### Using PM2
```bash
pm2 start server.ts --name api-server --interpreter tsx
```

## 📦 Dependencies

### Required Packages
```json
{
  "express": "^5.1.0",
  "mongoose": "^8.0.3",
  "cors": "^2.8.5",
  "helmet": "^8.1.0",
  "compression": "^1.8.1",
  "dotenv": "^17.2.3"
}
```

### Dev Dependencies
```json
{
  "tsx": "latest",
  "typescript": "^5",
  "@types/express": "latest",
  "@types/node": "^20"
}
```

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] .env file is configured
- [ ] Dependencies are installed
- [ ] TypeScript server starts without errors
- [ ] Health check endpoint responds
- [ ] API endpoints return data
- [ ] Instagram modal can fetch comments
- [ ] Instagram modal can fetch likes
- [ ] Like/unlike works
- [ ] Add comment works
- [ ] Save/unsave works
- [ ] Delete works (for owners)

## 🎉 Success!

If all checks pass, your Instagram modal should now work perfectly with:
- ✅ Real user data fetching
- ✅ Comments with avatars
- ✅ Likes list with user profiles
- ✅ All interactions working
- ✅ No 404 errors

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)

## 🆘 Need Help?

Check these files for more info:
- `INSTAGRAM_MODAL_COMPLETE.md` - Modal documentation
- `QUICK_REFERENCE.md` - Quick reference
- `TROUBLESHOOTING.md` - General troubleshooting

---

**Your Instagram-style modal is ready to use with a fully functional API!** 🚀
