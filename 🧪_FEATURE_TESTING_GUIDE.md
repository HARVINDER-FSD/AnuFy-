# 🧪 Feature Testing Guide

## Complete Feature & Button Testing Checklist

Test every feature and button in your application to ensure everything works.

---

## 🔐 Authentication Features

### Login Page (`/login`)
- [ ] **Email input** - Type email
- [ ] **Password input** - Type password
- [ ] **Show/Hide password button** - Toggle visibility
- [ ] **Login button** - Submit form
- [ ] **Remember me checkbox** - Toggle
- [ ] **Forgot password link** - Navigate
- [ ] **Register link** - Navigate to register
- [ ] **Error messages** - Display on invalid credentials
- [ ] **Success redirect** - Redirect to feed after login

### Register Page (`/register`)
- [ ] **Username input** - Type username
- [ ] **Email input** - Type email
- [ ] **Full name input** - Type name
- [ ] **Password input** - Type password
- [ ] **Confirm password input** - Type password
- [ ] **Show/Hide password buttons** - Toggle visibility
- [ ] **Register button** - Submit form
- [ ] **Terms checkbox** - Toggle
- [ ] **Login link** - Navigate to login
- [ ] **Error messages** - Display validation errors
- [ ] **Success redirect** - Redirect to feed after register

---

## 🏠 Home & Feed Features

### Home Page (`/`)
- [ ] **Get Started button** - Navigate to feed/login
- [ ] **Logo** - Display correctly
- [ ] **Theme toggle** - Switch dark/light mode

### Feed Page (`/feed`)
- [ ] **Post cards** - Display posts
- [ ] **Like button** - Like/unlike posts
- [ ] **Comment button** - Open comment modal
- [ ] **Share button** - Open share options
- [ ] **Bookmark button** - Save/unsave posts
- [ ] **More options (...)** - Open post menu
- [ ] **User avatar** - Navigate to profile
- [ ] **Username** - Navigate to profile
- [ ] **Post image** - Display and zoom
- [ ] **Load more** - Infinite scroll
- [ ] **Refresh** - Pull to refresh
- [ ] **Create post button** - Navigate to create

---

## 📝 Create Features

### Create Hub (`/create`)
- [ ] **Post tab** - Switch to post creation
- [ ] **Story tab** - Switch to story creation
- [ ] **Reel tab** - Switch to reel creation
- [ ] **Back button** - Navigate back

### Create Post (`/create/post`)
- [ ] **Caption input** - Type caption
- [ ] **Image upload button** - Open file picker
- [ ] **Image preview** - Display selected image
- [ ] **Remove image button** - Remove selected image
- [ ] **Location input** - Add location
- [ ] **Tag people button** - Tag users
- [ ] **Advanced settings** - Toggle options
- [ ] **Hide like count** - Toggle
- [ ] **Turn off commenting** - Toggle
- [ ] **Post button** - Submit post
- [ ] **Cancel button** - Discard and go back
- [ ] **Draft save** - Auto-save draft

### Create Reel (`/create/reel`)
- [ ] **Video upload button** - Open file picker
- [ ] **Video preview** - Display selected video
- [ ] **Trim video** - Edit video length
- [ ] **Add music button** - Search and add music
- [ ] **Caption input** - Type caption
- [ ] **Cover image selector** - Choose thumbnail
- [ ] **Post button** - Submit reel
- [ ] **Cancel button** - Discard and go back

### Create Story (`/stories/create`)
- [ ] **Image/Video upload** - Open file picker
- [ ] **Camera button** - Open camera
- [ ] **Text tool** - Add text
- [ ] **Drawing tool** - Draw on story
- [ ] **Sticker button** - Add stickers
- [ ] **Music button** - Add music
- [ ] **Your Story button** - Post to story
- [ ] **Close Friends button** - Post to close friends
- [ ] **Cancel button** - Discard

---

## 🎬 Reels Features

### Reels Page (`/reels`)
- [ ] **Reel player** - Auto-play video
- [ ] **Play/Pause** - Toggle playback
- [ ] **Mute/Unmute** - Toggle audio
- [ ] **Like button** - Like reel
- [ ] **Comment button** - Open comments
- [ ] **Share button** - Share reel
- [ ] **More options (...)** - Open menu
- [ ] **User avatar** - Navigate to profile
- [ ] **Username** - Navigate to profile
- [ ] **Follow button** - Follow user
- [ ] **Swipe up** - Next reel
- [ ] **Swipe down** - Previous reel
- [ ] **Progress bar** - Show video progress
- [ ] **View count** - Display views

---

## 📖 Stories Features

### Stories Bar (Top of Feed)
- [ ] **Story rings** - Display user stories
- [ ] **Your story (+)** - Create new story
- [ ] **Story avatar** - Open story viewer
- [ ] **Scroll left/right** - Navigate stories

### Story Viewer
- [ ] **Auto-advance** - Next story after timer
- [ ] **Tap left** - Previous story
- [ ] **Tap right** - Next story
- [ ] **Pause (hold)** - Pause story
- [ ] **Close button** - Exit viewer
- [ ] **Reply input** - Send reply
- [ ] **Like button** - Like story
- [ ] **Share button** - Share story
- [ ] **More options (...)** - Open menu
- [ ] **Progress bars** - Show story progress

---

## 👤 Profile Features

### Your Profile (`/profile`)
- [ ] **Edit Profile button** - Navigate to edit
- [ ] **Settings button** - Navigate to settings
- [ ] **Posts tab** - Show posts
- [ ] **Reels tab** - Show reels
- [ ] **Saved tab** - Show saved posts
- [ ] **Tagged tab** - Show tagged posts
- [ ] **Followers count** - Display count
- [ ] **Following count** - Display count
- [ ] **Posts count** - Display count
- [ ] **Bio** - Display bio
- [ ] **Website link** - Open link
- [ ] **Post grid** - Display posts
- [ ] **Post click** - Open post detail

### User Profile (`/profile/[username]`)
- [ ] **Follow button** - Follow/unfollow user
- [ ] **Message button** - Start conversation
- [ ] **More options (...)** - Open menu
- [ ] **Block user** - Block user
- [ ] **Report user** - Report user
- [ ] **Copy profile URL** - Copy link
- [ ] **Share profile** - Share options
- [ ] **Posts tab** - Show user posts
- [ ] **Reels tab** - Show user reels
- [ ] **Tagged tab** - Show tagged posts
- [ ] **Followers list** - View followers
- [ ] **Following list** - View following

### Edit Profile (`/profile/edit`)
- [ ] **Avatar upload** - Change profile picture
- [ ] **Name input** - Edit name
- [ ] **Username input** - Edit username
- [ ] **Bio input** - Edit bio
- [ ] **Website input** - Edit website
- [ ] **Email input** - Edit email
- [ ] **Phone input** - Edit phone
- [ ] **Gender select** - Select gender
- [ ] **Save button** - Save changes
- [ ] **Cancel button** - Discard changes
- [ ] **Remove avatar** - Remove picture

---

## 💬 Messages Features

### Messages List (`/messages`)
- [ ] **Conversation list** - Display conversations
- [ ] **New message button** - Start new chat
- [ ] **Search conversations** - Search input
- [ ] **Conversation click** - Open chat
- [ ] **Unread badge** - Show unread count
- [ ] **Last message** - Display preview
- [ ] **Timestamp** - Show time
- [ ] **Avatar** - Display user avatar

### Conversation (`/messages/[conversationId]`)
- [ ] **Message input** - Type message
- [ ] **Send button** - Send message
- [ ] **Emoji button** - Open emoji picker
- [ ] **Image upload** - Send image
- [ ] **Video upload** - Send video
- [ ] **Voice message** - Record audio
- [ ] **Message reactions** - React to messages
- [ ] **Message options** - Long press menu
- [ ] **Delete message** - Delete own message
- [ ] **Copy message** - Copy text
- [ ] **Reply to message** - Quote reply
- [ ] **Scroll to bottom** - Jump to latest
- [ ] **Load more** - Load older messages
- [ ] **User info** - View profile
- [ ] **Call button** - Start call
- [ ] **Video call button** - Start video call

---

## 🔔 Notifications Features

### Notifications Page (`/notifications`)
- [ ] **Notification list** - Display notifications
- [ ] **Mark all read** - Clear all
- [ ] **Notification click** - Navigate to content
- [ ] **Follow back button** - Follow user
- [ ] **Like notification** - Show who liked
- [ ] **Comment notification** - Show comment
- [ ] **Follow notification** - Show follower
- [ ] **Mention notification** - Show mention
- [ ] **Timestamp** - Show time
- [ ] **Avatar** - Display user avatar
- [ ] **Unread indicator** - Show unread
- [ ] **Delete notification** - Remove
- [ ] **Filter tabs** - All/Following/You

---

## 🔍 Search Features

### Search Page (`/search`)
- [ ] **Search input** - Type query
- [ ] **Search button** - Submit search
- [ ] **Clear button** - Clear input
- [ ] **Recent searches** - Show history
- [ ] **Clear history** - Remove all
- [ ] **Trending hashtags** - Display trends
- [ ] **Suggested users** - Show suggestions
- [ ] **Search results tabs** - Top/Accounts/Tags/Places
- [ ] **User result click** - Navigate to profile
- [ ] **Hashtag click** - Navigate to hashtag
- [ ] **Post result click** - Open post
- [ ] **Follow button** - Follow from results

---

## 🌟 Explore Features

### Explore Page (`/explore`)
- [ ] **Trending posts** - Display grid
- [ ] **Post click** - Open post detail
- [ ] **Category tabs** - Filter by category
- [ ] **Infinite scroll** - Load more
- [ ] **Refresh** - Reload content
- [ ] **Like button** - Quick like
- [ ] **View count** - Show views
- [ ] **Reels section** - Show trending reels
- [ ] **Stories section** - Show trending stories

---

## ⚙️ Settings Features

### Settings Page (`/settings`)
- [ ] **Edit Profile** - Navigate to edit
- [ ] **Privacy** - Navigate to privacy
- [ ] **Notifications** - Navigate to notifications
- [ ] **Blocked Users** - Navigate to blocked
- [ ] **Delete Account** - Navigate to delete
- [ ] **Logout button** - Sign out
- [ ] **Theme toggle** - Switch theme
- [ ] **Language select** - Change language

### Privacy Settings (`/settings/privacy`)
- [ ] **Private account toggle** - Make private
- [ ] **Activity status toggle** - Show online
- [ ] **Story sharing toggle** - Allow sharing
- [ ] **Message settings** - Who can message
- [ ] **Comment settings** - Who can comment
- [ ] **Tag settings** - Who can tag
- [ ] **Mention settings** - Who can mention
- [ ] **Save button** - Save changes

### Notification Settings (`/settings/notifications`)
- [ ] **Push notifications toggle** - Enable/disable
- [ ] **Likes toggle** - Notify on likes
- [ ] **Comments toggle** - Notify on comments
- [ ] **Follows toggle** - Notify on follows
- [ ] **Messages toggle** - Notify on messages
- [ ] **Email notifications toggle** - Email alerts
- [ ] **Save button** - Save changes

### Blocked Users (`/settings/blocked`)
- [ ] **Blocked users list** - Display blocked
- [ ] **Unblock button** - Unblock user
- [ ] **Search blocked** - Search input

### Delete Account (`/settings/delete`)
- [ ] **Reason select** - Choose reason
- [ ] **Password input** - Confirm password
- [ ] **Delete button** - Delete account
- [ ] **Cancel button** - Go back
- [ ] **Confirmation modal** - Confirm deletion

---

## 📱 Navigation Features

### Header
- [ ] **Logo** - Navigate to home
- [ ] **Search icon** - Open search
- [ ] **Notifications icon** - Open notifications
- [ ] **Messages icon** - Open messages
- [ ] **Profile icon** - Open profile menu
- [ ] **Create button (+)** - Open create menu
- [ ] **Notification badge** - Show unread count
- [ ] **Message badge** - Show unread count

### Mobile Navigation
- [ ] **Home icon** - Navigate to feed
- [ ] **Search icon** - Navigate to search
- [ ] **Create icon** - Open create
- [ ] **Reels icon** - Navigate to reels
- [ ] **Profile icon** - Navigate to profile
- [ ] **Active indicator** - Highlight current page

### Sidebar (Desktop)
- [ ] **Home** - Navigate to feed
- [ ] **Search** - Open search
- [ ] **Explore** - Navigate to explore
- [ ] **Reels** - Navigate to reels
- [ ] **Messages** - Navigate to messages
- [ ] **Notifications** - Open notifications
- [ ] **Create** - Open create menu
- [ ] **Profile** - Navigate to profile
- [ ] **More** - Open more menu
- [ ] **Collapse/Expand** - Toggle sidebar

---

## 🎨 UI Features

### Theme
- [ ] **Dark mode** - Switch to dark
- [ ] **Light mode** - Switch to light
- [ ] **System mode** - Follow system
- [ ] **Smooth transition** - Animate change

### Modals
- [ ] **Post detail modal** - Open/close
- [ ] **Comment modal** - Open/close
- [ ] **Share modal** - Open/close
- [ ] **Followers modal** - Open/close
- [ ] **Following modal** - Open/close
- [ ] **Likes modal** - Open/close
- [ ] **Options modal** - Open/close
- [ ] **Confirmation modal** - Open/close
- [ ] **Close button (X)** - Close modal
- [ ] **Click outside** - Close modal
- [ ] **ESC key** - Close modal

### Toasts/Alerts
- [ ] **Success toast** - Show success
- [ ] **Error toast** - Show error
- [ ] **Info toast** - Show info
- [ ] **Warning toast** - Show warning
- [ ] **Auto-dismiss** - Close after timeout
- [ ] **Close button** - Manual close

---

## 🔄 Real-time Features

### Live Updates
- [ ] **New post notification** - Show new posts
- [ ] **New message** - Real-time messages
- [ ] **New notification** - Real-time alerts
- [ ] **Online status** - Show user online
- [ ] **Typing indicator** - Show typing
- [ ] **Read receipts** - Show message read

---

## 📊 Performance Features

### Loading States
- [ ] **Skeleton loaders** - Show placeholders
- [ ] **Spinner** - Show loading
- [ ] **Progress bar** - Show progress
- [ ] **Lazy loading** - Load on scroll
- [ ] **Image optimization** - Compress images

### Error Handling
- [ ] **404 page** - Show not found
- [ ] **Error boundary** - Catch errors
- [ ] **Retry button** - Retry failed requests
- [ ] **Offline mode** - Show offline message

---

## ✅ Testing Checklist Summary

### Critical Features (Must Work)
- [ ] Login/Register
- [ ] Create Post
- [ ] Like/Comment
- [ ] Follow/Unfollow
- [ ] Messages
- [ ] Notifications
- [ ] Profile Edit
- [ ] Search

### Important Features (Should Work)
- [ ] Create Reel
- [ ] Create Story
- [ ] Share
- [ ] Bookmark
- [ ] Settings
- [ ] Theme Toggle
- [ ] Real-time Updates

### Nice-to-Have Features (Can Work)
- [ ] Advanced Search
- [ ] Analytics
- [ ] Trending
- [ ] Hashtags
- [ ] Mentions
- [ ] Tags

---

## 🚀 How to Test

### Manual Testing
1. Start the app: `npm run dev`
2. Open: http://localhost:3001
3. Go through each section above
4. Check each checkbox as you test
5. Note any issues

### Automated Testing
```bash
# Run tests (if configured)
npm test

# Run E2E tests (if configured)
npm run test:e2e
```

---

## 📝 Report Issues

If you find any issues:
1. Note the feature/button
2. Describe what happened
3. Describe what should happen
4. Include error messages
5. Include screenshots if possible

---

**Test thoroughly and check off each item!** ✅
