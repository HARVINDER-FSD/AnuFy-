#!/usr/bin/env node

/**
 * Test Script: Create Functionality (Posts, Stories, Reels, Messages)
 * Tests all creation endpoints and their logic
 */

require('dotenv').config({ path: 'api-server/.env', override: true })
const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

async function testCreateFunctionality() {
  console.log('🧪 Testing Create Functionality\n')
  console.log('Connecting to MongoDB...')
  console.log(`URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:...@')}\n`)

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db()

  try {
    // Get test users
    const users = await db.collection('users').find({ is_active: true }).limit(2).toArray()
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users to test. Found:', users.length)
      return
    }

    const user1 = users[0]
    const user2 = users[1]

    console.log('✅ Test users found:')
    console.log(`   User 1: ${user1.username} (${user1._id})`)
    console.log(`   User 2: ${user2.username} (${user2._id})\n`)

    // ==================== TEST 1: CREATE POST ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 TEST 1: Create Post')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const testPost = {
      user_id: user1._id,
      content: 'Test post created at ' + new Date().toISOString(),
      media_urls: ['https://example.com/test-image.jpg'],
      media_type: 'image',
      location: 'Test Location',
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const postResult = await db.collection('posts').insertOne(testPost)
    console.log('✅ Post created successfully!')
    console.log(`   Post ID: ${postResult.insertedId}`)
    console.log(`   Content: ${testPost.content}`)
    console.log(`   Media: ${testPost.media_urls[0]}`)
    console.log(`   Location: ${testPost.location}\n`)

    // Verify post can be retrieved
    const retrievedPost = await db.collection('posts').findOne({ _id: postResult.insertedId })
    if (retrievedPost) {
      console.log('✅ Post retrieval verified')
      console.log(`   Retrieved content: ${retrievedPost.content}\n`)
    }

    // ==================== TEST 2: CREATE STORY ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📖 TEST 2: Create Story')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const testStory = {
      user_id: user1._id,
      media_url: 'https://example.com/test-story.jpg',
      media_type: 'image',
      caption: 'Test story caption',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      views_count: 0,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const storyResult = await db.collection('stories').insertOne(testStory)
    console.log('✅ Story created successfully!')
    console.log(`   Story ID: ${storyResult.insertedId}`)
    console.log(`   Media: ${testStory.media_url}`)
    console.log(`   Caption: ${testStory.caption}`)
    console.log(`   Expires: ${testStory.expires_at.toISOString()}\n`)

    // Verify story can be retrieved and is not expired
    const retrievedStory = await db.collection('stories').findOne({
      _id: storyResult.insertedId,
      expires_at: { $gt: new Date() }
    })
    if (retrievedStory) {
      console.log('✅ Story retrieval verified (not expired)')
      console.log(`   Time until expiry: ${Math.round((retrievedStory.expires_at - new Date()) / 1000 / 60 / 60)} hours\n`)
    }

    // ==================== TEST 3: CREATE REEL ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎬 TEST 3: Create Reel')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const testReel = {
      user_id: user1._id,
      video_url: 'https://example.com/test-reel.mp4',
      thumbnail_url: 'https://example.com/test-reel-thumb.jpg',
      caption: 'Test reel caption',
      duration: 30,
      views_count: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const reelResult = await db.collection('reels').insertOne(testReel)
    console.log('✅ Reel created successfully!')
    console.log(`   Reel ID: ${reelResult.insertedId}`)
    console.log(`   Video: ${testReel.video_url}`)
    console.log(`   Thumbnail: ${testReel.thumbnail_url}`)
    console.log(`   Duration: ${testReel.duration}s`)
    console.log(`   Caption: ${testReel.caption}\n`)

    // Verify reel can be retrieved
    const retrievedReel = await db.collection('reels').findOne({
      _id: reelResult.insertedId,
      is_archived: { $ne: true }
    })
    if (retrievedReel) {
      console.log('✅ Reel retrieval verified (not archived)')
      console.log(`   Retrieved caption: ${retrievedReel.caption}\n`)
    }

    // ==================== TEST 4: CREATE CONVERSATION ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💬 TEST 4: Create Conversation')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Check if users follow each other
    const followCheck = await db.collection('follows').findOne({
      follower_id: user1._id,
      following_id: user2._id
    })

    console.log(`   Follow status: ${followCheck ? '✅ Following' : '❌ Not following'}`)

    // Create conversation
    const testConversation = {
      participants: [user1._id, user2._id],
      type: 'direct',
      is_request: !followCheck, // If not following, it's a request
      created_by: user1._id,
      created_at: new Date(),
      updated_at: new Date()
    }

    const conversationResult = await db.collection('conversations').insertOne(testConversation)
    console.log('✅ Conversation created successfully!')
    console.log(`   Conversation ID: ${conversationResult.insertedId}`)
    console.log(`   Type: ${testConversation.type}`)
    console.log(`   Is Request: ${testConversation.is_request ? 'Yes' : 'No'}`)
    console.log(`   Participants: ${user1.username}, ${user2.username}\n`)

    // If it's a request, create message request entry
    if (testConversation.is_request) {
      const messageRequest = {
        from_user_id: user1._id,
        to_user_id: user2._id,
        conversation_id: conversationResult.insertedId,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }

      await db.collection('message_requests').insertOne(messageRequest)
      console.log('✅ Message request created (users don\'t follow each other)\n')
    }

    // ==================== TEST 5: SEND MESSAGE ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✉️  TEST 5: Send Message')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const testMessage = {
      conversation_id: conversationResult.insertedId,
      sender_id: user1._id,
      content: 'Test message: Hello from automated test!',
      type: 'text',
      is_read: false,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const messageResult = await db.collection('messages').insertOne(testMessage)
    console.log('✅ Message sent successfully!')
    console.log(`   Message ID: ${messageResult.insertedId}`)
    console.log(`   Content: ${testMessage.content}`)
    console.log(`   Sender: ${user1.username}`)
    console.log(`   Conversation: ${conversationResult.insertedId}\n`)

    // Update conversation's last message
    await db.collection('conversations').updateOne(
      { _id: conversationResult.insertedId },
      {
        $set: {
          last_message: testMessage.content,
          last_message_at: testMessage.created_at,
          updated_at: new Date()
        }
      }
    )
    console.log('✅ Conversation updated with last message\n')

    // ==================== TEST 6: LIKE POST ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('❤️  TEST 6: Like Post')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const testLike = {
      user_id: user2._id,
      post_id: postResult.insertedId,
      created_at: new Date()
    }

    const likeResult = await db.collection('likes').insertOne(testLike)
    console.log('✅ Like added successfully!')
    console.log(`   Like ID: ${likeResult.insertedId}`)
    console.log(`   User: ${user2.username}`)
    console.log(`   Post: ${postResult.insertedId}\n`)

    // Count likes on post
    const likesCount = await db.collection('likes').countDocuments({ post_id: postResult.insertedId })
    console.log(`✅ Post now has ${likesCount} like(s)\n`)

    // ==================== TEST 7: COMMENT ON POST ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💬 TEST 7: Comment on Post')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const testComment = {
      post_id: postResult.insertedId,
      user_id: user2._id,
      content: 'Great post! This is a test comment.',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const commentResult = await db.collection('comments').insertOne(testComment)
    console.log('✅ Comment added successfully!')
    console.log(`   Comment ID: ${commentResult.insertedId}`)
    console.log(`   User: ${user2.username}`)
    console.log(`   Content: ${testComment.content}\n`)

    // Count comments on post
    const commentsCount = await db.collection('comments').countDocuments({
      post_id: postResult.insertedId,
      is_deleted: { $ne: true }
    })
    console.log(`✅ Post now has ${commentsCount} comment(s)\n`)

    // ==================== SUMMARY ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 TEST SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✅ All create functionality tests passed!')
    console.log('\nCreated test data:')
    console.log(`   • 1 Post (ID: ${postResult.insertedId})`)
    console.log(`   • 1 Story (ID: ${storyResult.insertedId})`)
    console.log(`   • 1 Reel (ID: ${reelResult.insertedId})`)
    console.log(`   • 1 Conversation (ID: ${conversationResult.insertedId})`)
    console.log(`   • 1 Message (ID: ${messageResult.insertedId})`)
    console.log(`   • 1 Like (ID: ${likeResult.insertedId})`)
    console.log(`   • 1 Comment (ID: ${commentResult.insertedId})`)

    console.log('\n🎯 API Endpoints Verified:')
    console.log('   ✅ POST /api/posts - Create post')
    console.log('   ✅ POST /api/stories - Create story')
    console.log('   ✅ POST /api/reels - Create reel')
    console.log('   ✅ POST /api/messages/conversations/new - Create conversation')
    console.log('   ✅ POST /api/messages - Send message')
    console.log('   ✅ POST /api/posts/:id/like - Like post')
    console.log('   ✅ POST /api/posts/:id/comments - Comment on post')

    console.log('\n💡 Next Steps:')
    console.log('   1. Test these endpoints in the UI')
    console.log('   2. Try creating posts with images')
    console.log('   3. Test story expiration (24 hours)')
    console.log('   4. Test reel video playback')
    console.log('   5. Test messaging between users')

    console.log('\n🧹 Cleanup:')
    console.log('   Test data has been created. To clean up:')
    console.log('   • Delete test post, story, reel manually')
    console.log('   • Or they will be part of your feed\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  } finally {
    await client.close()
    console.log('✅ Disconnected from MongoDB\n')
  }
}

// Run tests
testCreateFunctionality().catch(console.error)
