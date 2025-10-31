#!/usr/bin/env node

/**
 * Diagnose Upload Issues
 * Check why stories, reels, and posts aren't working
 */

require('dotenv').config({ path: 'api-server/.env', override: true })
const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

async function diagnoseIssues() {
  console.log('🔍 Diagnosing Upload Issues\n')

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db()

  try {
    // Check collections exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    console.log('📦 Available Collections:')
    console.log(`   ${collectionNames.join(', ')}\n`)

    // ==================== CHECK POSTS ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 POSTS DIAGNOSIS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const totalPosts = await db.collection('posts').countDocuments()
    const activePosts = await db.collection('posts').countDocuments({ is_archived: { $ne: true } })
    const archivedPosts = await db.collection('posts').countDocuments({ is_archived: true })

    console.log(`Total posts: ${totalPosts}`)
    console.log(`Active posts: ${activePosts}`)
    console.log(`Archived posts: ${archivedPosts}`)

    if (totalPosts > 0) {
      const samplePost = await db.collection('posts').findOne()
      console.log('\nSample post structure:')
      console.log(JSON.stringify(samplePost, null, 2))
    } else {
      console.log('\n❌ No posts found in database!')
    }

    // ==================== CHECK STORIES ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📖 STORIES DIAGNOSIS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const totalStories = await db.collection('stories').countDocuments()
    const activeStories = await db.collection('stories').countDocuments({ 
      is_deleted: { $ne: true },
      expires_at: { $gt: new Date() }
    })
    const expiredStories = await db.collection('stories').countDocuments({ 
      expires_at: { $lte: new Date() }
    })
    const deletedStories = await db.collection('stories').countDocuments({ is_deleted: true })

    console.log(`Total stories: ${totalStories}`)
    console.log(`Active stories (not expired): ${activeStories}`)
    console.log(`Expired stories: ${expiredStories}`)
    console.log(`Deleted stories: ${deletedStories}`)

    if (totalStories > 0) {
      const sampleStory = await db.collection('stories').findOne()
      console.log('\nSample story structure:')
      console.log(JSON.stringify(sampleStory, null, 2))

      // Check if story has user populated
      if (sampleStory.user_id) {
        const user = await db.collection('users').findOne({ _id: sampleStory.user_id })
        console.log('\nStory user exists:', !!user)
        if (user) {
          console.log(`User: ${user.username}`)
        }
      }
    } else {
      console.log('\n❌ No stories found in database!')
    }

    // ==================== CHECK REELS ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎬 REELS DIAGNOSIS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const totalReels = await db.collection('reels').countDocuments()
    const activeReels = await db.collection('reels').countDocuments({ is_archived: { $ne: true } })
    const archivedReels = await db.collection('reels').countDocuments({ is_archived: true })

    console.log(`Total reels: ${totalReels}`)
    console.log(`Active reels: ${activeReels}`)
    console.log(`Archived reels: ${archivedReels}`)

    if (totalReels > 0) {
      const allReels = await db.collection('reels').find().toArray()
      console.log('\nAll reels in database:')
      allReels.forEach((reel, i) => {
        console.log(`\n${i + 1}. Reel ID: ${reel._id}`)
        console.log(`   User ID: ${reel.user_id}`)
        console.log(`   Video URL: ${reel.video_url}`)
        console.log(`   Caption: ${reel.caption || reel.description || 'No caption'}`)
        console.log(`   Is Archived: ${reel.is_archived || false}`)
        console.log(`   Created: ${reel.created_at}`)
      })

      // Check if reel has user populated
      const sampleReel = allReels[0]
      if (sampleReel.user_id) {
        const user = await db.collection('users').findOne({ _id: sampleReel.user_id })
        console.log('\nReel user exists:', !!user)
        if (user) {
          console.log(`User: ${user.username}`)
        }
      }
    } else {
      console.log('\n❌ No reels found in database!')
    }

    // ==================== CHECK API ROUTES ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔌 API ROUTES CHECK')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('Expected API routes:')
    console.log('   POST /api/posts - Create post')
    console.log('   POST /api/stories - Create story')
    console.log('   POST /api/reels - Create reel')
    console.log('   GET /api/posts - Get posts')
    console.log('   GET /api/stories - Get stories')
    console.log('   GET /api/reels - Get reels')

    // ==================== IDENTIFY ISSUES ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 IDENTIFIED ISSUES')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const issues = []

    if (activePosts === 0) {
      issues.push('❌ No active posts - Post creation may be failing')
    }

    if (activeStories === 0) {
      issues.push('❌ No active stories - Story creation may be failing or all expired')
    }

    if (activeReels === 0 && totalReels > 0) {
      issues.push('❌ Reels exist but all are archived - Check is_archived field')
    } else if (totalReels === 0) {
      issues.push('❌ No reels in database - Reel creation may be failing')
    }

    if (issues.length === 0) {
      console.log('✅ No issues detected!')
    } else {
      issues.forEach(issue => console.log(issue))
    }

    // ==================== RECOMMENDATIONS ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💡 RECOMMENDATIONS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (activePosts === 0) {
      console.log('📝 Posts:')
      console.log('   1. Check if POST /api/posts endpoint is working')
      console.log('   2. Check authentication token is valid')
      console.log('   3. Check MongoDB connection in backend')
      console.log('   4. Check for errors in browser console')
    }

    if (activeStories === 0) {
      console.log('\n📖 Stories:')
      console.log('   1. Check if POST /api/stories endpoint is working')
      console.log('   2. Verify expires_at is set to 24 hours in future')
      console.log('   3. Check if stories are being created but immediately expiring')
      console.log('   4. Check backend story creation logic')
    }

    if (totalReels > 0 && activeReels === 0) {
      console.log('\n🎬 Reels:')
      console.log('   1. Reels exist but are archived')
      console.log('   2. Check is_archived field in database')
      console.log('   3. May need to update existing reels to set is_archived: false')
    } else if (totalReels === 0) {
      console.log('\n🎬 Reels:')
      console.log('   1. Check if POST /api/reels endpoint is working')
      console.log('   2. Check video upload to Cloudinary')
      console.log('   3. Check MongoDB connection')
      console.log('   4. Check for errors in browser console')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('\n✅ Disconnected from MongoDB\n')
  }
}

diagnoseIssues().catch(console.error)
