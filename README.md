# AnuFy - Social Media Platform

A modern, full-featured social media platform built with Next.js, featuring Instagram-like stories, posts, reels, and real-time chat.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - Secure JWT-based authentication
- ✅ **Posts** - Create, like, comment, and share posts
- ✅ **Stories** - 24-hour ephemeral stories with filters, stickers, and text
- ✅ **Reels** - Short-form video content
- ✅ **Real-time Chat** - Instagram-style messaging with reactions
- ✅ **User Profiles** - Customizable profiles with followers/following
- ✅ **Feed** - Personalized content feed
- ✅ **Search** - Find users and content
- ✅ **Notifications** - Stay updated with activity

### Advanced Features
- 📸 **Story Creator** - Advanced story editing with filters, stickers, text, and drawings
- 💬 **Instagram-style Chat** - Message reactions, media sharing, voice messages
- 🎨 **Dark/Light Mode** - Theme customization
- 📱 **Responsive Design** - Mobile-first approach
- 🔒 **Privacy Controls** - Private accounts, blocked users
- 🔖 **Bookmarks** - Save posts for later
- 🎭 **Profile Customization** - Bio, avatar, and more

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Beautiful icon set

### Backend
- **Express.js** - REST API server
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **Socket.io** - Real-time features

### Storage & Services
- **Cloudinary** - Media storage and optimization
- **Upstash Redis** - Caching and sessions

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/anufy.git
cd anufy
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# MongoDB Atlas
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
CLOUDINARY_DEFAULT_FOLDER=uploads

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Optional: OpenAI for moderation
OPENAI_API_KEY=your_openai_api_key
```

4. **Run the development servers**

Terminal 1 - Frontend (Next.js):
```bash
npm run dev
```

Terminal 2 - Backend (Express):
```bash
npm run dev:server
```

5. **Open your browser**
```
http://localhost:3000
```

## 🗄️ Database Setup

### MongoDB Atlas
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)
4. Create a database user
5. Get your connection string and add it to `.env`

### Collections
The following collections will be created automatically:
- `users` - User accounts and profiles
- `posts` - User posts
- `reels` - Short videos
- `stories` - 24-hour stories
- `comments` - Post and reel comments
- `messages` - Chat messages
- `conversations` - Chat conversations
- `bookmarks` - Saved content

## 🚀 Deployment

### Vercel (Recommended for Frontend)
1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Backend Deployment
- Deploy Express server to Railway, Render, or Heroku
- Update API endpoints in frontend

## 📱 Features Overview

### Stories
- Upload photos/videos
- Add text with custom fonts and colors
- Apply Instagram-like filters
- Add stickers and emojis
- Draw on stories
- View analytics (views, likes)
- 24-hour auto-expiry

### Posts
- Upload multiple images
- Add captions and hashtags
- Like and comment
- Share to other platforms
- Save/bookmark posts
- Delete your own posts

### Chat
- Real-time messaging
- Message reactions
- Media sharing
- Voice messages (planned)
- Read receipts
- Typing indicators

### Profile
- Customizable bio and avatar
- Posts, Reels, and Saved tabs
- Followers/Following lists
- Private account option
- Account settings

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- XSS protection
- CORS configuration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ by the AnuFy team

## 🙏 Acknowledgments

- Inspired by Instagram's UI/UX
- Built with modern web technologies
- Community feedback and contributions

---

**Note**: This is a learning project. Not affiliated with Instagram or Meta.
