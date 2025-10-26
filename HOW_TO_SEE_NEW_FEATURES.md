# 🎯 How to See New Features

## 📍 **WHERE TO FIND EVERYTHING**

### 1. **Explore Page (Trending Content)** 🌟

**URL:** `/explore`

**What You'll See:**
- Trending posts (most engagement in last 7 days)
- Trending reels (most views + likes)
- Suggested users (new popular accounts)
- Category tabs (Trending, People, Photos, Videos)

**How It Works:**
- The page fetches from `/api/explore/trending`
- Shows content sorted by engagement score
- Auto-refreshes with new trending content

**To Test:**
1. Go to `/explore` in your browser
2. Click on different category tabs
3. See trending posts and reels
4. Click on suggested users

---

### 2. **Search History** 🔍

**URL:** `/search`

**What You'll See:**
- Recent searches (last 10)
- Clear history button
- Click on history item to search again

**How It Works:**
- Automatically saves every search
- Stores in database with 30-day expiry
- Shows when search box is empty

**To Test:**
1. Go to `/search`
2. Search for anything (e.g., "john", "#travel")
3. Clear the search box
4. You'll see your recent searches below
5. Click "Clear History" to remove all

**Current Status:** ⚠️ UI needs to be added to search page

---

### 3. **Hashtag Pages** #️⃣

**URL:** `/hashtag/[tag]`

**Examples:**
- `/hashtag/travel` - All posts with #travel
- `/hashtag/food` - All posts with #food
- `/hashtag/sunset` - All posts with #sunset

**What You'll See:**
- All posts with that hashtag
- All reels with that hashtag
- Post count
- Grid layout
- Tabs to switch between posts/reels

**How It Works:**
- Searches posts and reels for the hashtag
- Shows in Instagram-style grid
- Click any post to view

**To Test:**
1. Create a post with hashtag (e.g., "#test")
2. Go to `/hashtag/test`
3. See your post in the grid
4. Switch between Posts and Reels tabs

---

### 4. **Blocked Users** 🚫

**URL:** `/settings/blocked`

**What You'll See:**
- List of all blocked users
- Unblock button for each
- Confirmation dialog before unblocking

**How It Works:**
- Shows users you've blocked
- Click "Unblock" to remove block
- Blocked users can't see your content

**To Test:**
1. Block a user from their profile
2. Go to Settings → Blocked Accounts
3. See the blocked user in list
4. Click "Unblock" to remove

**Already Linked:** ✅ In settings page

---

### 5. **Notifications** 🔔

**URL:** Header (Bell Icon)

**What You'll See:**
- Dropdown with last 15 notifications
- Red badge with unread count
- Click to navigate to content
- Mark as read / Mark all as read

**How It Works:**
- Auto-refreshes every 30 seconds
- Shows likes, follows, comments, etc.
- Click notification to go to that content

**To Test:**
1. Have someone like your post
2. Wait 30 seconds or refresh
3. See red badge on bell icon
4. Click bell to see notification
5. Click notification to navigate

**Already Working:** ✅ In header

---

### 6. **Report System** 🚨

**URL:** Dropdown menu on posts/reels/users

**What You'll See:**
- "Report" option in menu
- Modal with 7 report categories
- Optional description field
- Submit button

**How It Works:**
- Click "..." menu on any content
- Select "Report"
- Choose reason
- Add description (optional)
- Submit

**To Test:**
1. Go to any post
2. Click "..." (three dots)
3. Click "Report"
4. Select a reason
5. Submit report

**Current Status:** ⚠️ Needs to be added to post/reel menus

---

## 🔧 **QUICK FIXES NEEDED**

### **Fix 1: Add Search History UI to Search Page**

The search history API works, but the UI needs to be added to `/app/search/page.tsx`.

**What to Add:**
```typescript
// Show when searchQuery is empty
{!searchQuery && searchHistory.length > 0 && (
  <div className="p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">Recent Searches</h3>
      <Button variant="ghost" size="sm" onClick={clearHistory}>
        Clear All
      </Button>
    </div>
    <div className="space-y-2">
      {searchHistory.map((item) => (
        <button
          key={item.id}
          onClick={() => setSearchQuery(item.query)}
          className="w-full text-left p-2 hover:bg-accent rounded"
        >
          {item.query}
        </button>
      ))}
    </div>
  </div>
)}
```

---

### **Fix 2: Add Report Button to Post/Reel Menus**

**In `components/posts/post-card.tsx`:**
```typescript
import { ReportModal } from '@/components/moderation/report-modal'

// Add state
const [showReport, setShowReport] = useState(false)

// In dropdown menu
<DropdownMenuItem onClick={() => setShowReport(true)}>
  Report Post
</DropdownMenuItem>

// Add modal
<ReportModal
  isOpen={showReport}
  onClose={() => setShowReport(false)}
  contentType="post"
  contentId={post.id}
  reportedUserId={post.user.id}
/>
```

---

### **Fix 3: Update Explore Page to Use New API**

Already done! ✅ The explore page now uses `/api/explore/trending`

---

## 📝 **TESTING GUIDE**

### **Test Scenario 1: Complete User Journey**

1. **Login** → Go to `/login`
2. **Create Post** → Add hashtag "#test"
3. **Search** → Search for "#test"
4. **View Hashtag** → Click on #test
5. **See Post** → Your post appears
6. **Block User** → Block someone
7. **Check Settings** → Go to `/settings/blocked`
8. **See Blocked** → User appears in list
9. **Unblock** → Click unblock
10. **Check Notifications** → See bell icon badge
11. **View Trending** → Go to `/explore`
12. **See Content** → Trending posts/reels

---

## 🎯 **SUMMARY**

**Working & Visible:**
- ✅ Notifications (bell icon in header)
- ✅ Blocked Users (`/settings/blocked`)
- ✅ Hashtag Pages (`/hashtag/[tag]`)
- ✅ Explore/Trending (`/explore`)

**Working But Hidden:**
- ⚠️ Search History (API works, UI needs update)
- ⚠️ Report System (API works, needs UI integration)

**Quick Fixes Needed:**
1. Add search history UI to search page (5 minutes)
2. Add report button to post/reel menus (10 minutes)

---

**Want me to add these quick fixes now?**
