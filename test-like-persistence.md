# Like Persistence Test

## Test Steps

1. Open your browser DevTools (F12)
2. Go to the Network tab
3. Filter by "like" in the network requests
4. Like a post (single click)
5. Watch the Network tab - you should see ONE request to `/api/posts/[postId]/like`
6. Check the response - it should show `"liked": true`
7. Wait 5 seconds
8. DO NOT refresh yet - open a new tab and go to: `http://localhost:3000/api/debug/likes`
9. Check if the like is there
10. If YES, then refresh the original page
11. Check the Network tab again - see if there's another request to `/api/posts/[postId]/like`

## What to look for:

- **If you see TWO requests in step 5**: You're double-clicking
- **If the like is NOT in the debug endpoint (step 9)**: The write isn't persisting to MongoDB Atlas
- **If you see a request on page refresh (step 11)**: Something is calling the unlike API on page load

## Share with me:

1. Screenshot of the Network tab showing the like requests
2. The response from `/api/debug/likes`
3. Any console logs from the terminal
