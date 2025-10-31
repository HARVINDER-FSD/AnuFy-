# 🎯 Quick Test Checklist

## 5-Minute Essential Feature Test

Test the most critical features quickly.

---

## ✅ Quick Test (5 minutes)

### 1. Authentication (1 min)
- [ ] Open http://localhost:3001
- [ ] Click "Login" or "Get Started"
- [ ] Try logging in (or register if needed)
- [ ] Verify redirect to feed

### 2. Feed & Posts (1 min)
- [ ] See posts in feed
- [ ] Click ❤️ (Like button) on a post
- [ ] Click 💬 (Comment button)
- [ ] Click 🔖 (Bookmark button)
- [ ] Click user avatar → goes to profile

### 3. Create Content (1 min)
- [ ] Click ➕ (Create button)
- [ ] Select "Post"
- [ ] Upload an image
- [ ] Type a caption
- [ ] Click "Post" button
- [ ] Verify post appears in feed

### 4. Navigation (1 min)
- [ ] Click 🏠 (Home) - goes to feed
- [ ] Click 🔍 (Search) - opens search
- [ ] Click 🔔 (Notifications) - shows notifications
- [ ] Click 💬 (Messages) - opens messages
- [ ] Click 👤 (Profile) - goes to profile

### 5. Profile & Settings (1 min)
- [ ] Go to your profile
- [ ] Click "Edit Profile"
- [ ] Change bio
- [ ] Click "Save"
- [ ] Click ⚙️ (Settings)
- [ ] Toggle theme (Dark/Light)

---

## ✅ Medium Test (15 minutes)

### Posts & Interactions
- [ ] Create a post with image
- [ ] Like a post
- [ ] Unlike a post
- [ ] Comment on a post
- [ ] Reply to a comment
- [ ] Share a post
- [ ] Bookmark a post
- [ ] Delete your post

### Reels
- [ ] Go to Reels page
- [ ] Watch a reel (auto-play)
- [ ] Like a reel
- [ ] Comment on a reel
- [ ] Swipe to next reel
- [ ] Create a reel (if possible)

### Stories
- [ ] View someone's story
- [ ] Tap to advance story
- [ ] Reply to a story
- [ ] Create your own story
- [ ] View your story

### Social Features
- [ ] Search for a user
- [ ] Visit their profile
- [ ] Follow them
- [ ] Unfollow them
- [ ] Send them a message
- [ ] Block them (optional)

### Messages
- [ ] Open messages
- [ ] Start new conversation
- [ ] Send a text message
- [ ] Send an emoji
- [ ] Send an image
- [ ] React to a message
- [ ] Delete a message

### Notifications
- [ ] Check notifications
- [ ] Click on a notification
- [ ] Mark all as read
- [ ] Clear notifications

---

## ✅ Full Test (30+ minutes)

Use the complete **🧪_FEATURE_TESTING_GUIDE.md** for comprehensive testing.

---

## 🚨 Critical Issues to Check

### Must Work
- [ ] ✅ Login works
- [ ] ✅ Posts display
- [ ] ✅ Like button works
- [ ] ✅ Create post works
- [ ] ✅ Navigation works
- [ ] ✅ Profile loads
- [ ] ✅ No console errors

### Should Work
- [ ] ✅ Comments work
- [ ] ✅ Follow/unfollow works
- [ ] ✅ Messages work
- [ ] ✅ Search works
- [ ] ✅ Notifications work
- [ ] ✅ Theme toggle works

### Nice to Have
- [ ] ✅ Reels work
- [ ] ✅ Stories work
- [ ] ✅ Share works
- [ ] ✅ Bookmark works
- [ ] ✅ Settings work

---

## 🔧 How to Run Tests

### 1. Start the App
```bash
npm run dev
```

### 2. Run Automated Tests (Optional)
```bash
# Run the test script
.\test-features.ps1
```

### 3. Manual Testing
- Open http://localhost:3001
- Go through the checklist above
- Check each item as you test

---

## 📊 Test Results

### Pass Criteria
- ✅ All "Must Work" items pass
- ✅ Most "Should Work" items pass
- ✅ No critical errors in console

### If Tests Fail
1. Check console for errors
2. Check network tab for failed requests
3. Check if MongoDB is connected
4. Check if all services are running
5. Review error messages

---

## 🎉 Success!

If all critical features work:
- ✅ Your app is ready to use!
- ✅ Start building more features
- ✅ Deploy to production

---

**Start testing now!** 🚀

Open: http://localhost:3001
