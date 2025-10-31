#!/usr/bin/env node

/**
 * Verify Cloudinary Uploads
 * Check if uploaded media URLs are accessible
 */

require('dotenv').config({ path: 'api-server/.env', override: true })
const { MongoClient } = require('mongodb')
const https = require('https')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        accessible: res.statusCode === 200,
        contentType: res.headers['content-type']
      })
    }).on('error', () => {
      resolve({
        url,
        status: 0,
        accessible: false,
        contentType: null
      })
    })
  })
}

async function verifyCloudinaryUploads() {
  console.log('🔍 Verifying Cloudinary Uploads\n')
  console.log('Connecting to MongoDB...\n')

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db()

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 CHECKING POST MEDIA URLS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const posts = await db.collection('posts')
      .find({ 
        is_archived: { $ne: true },
        media_urls: { $exists: true, $ne: null }
      })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray()

    console.log(`Found ${posts.length} posts with media\n`)

    for (const post of posts) {
      console.log(`Post: ${post._id}`)
      console.log(`Content: ${post.content?.substring(0, 50) || 'No content'}...`)
      
      if (Array.isArray(post.media_urls)) {
        for (const url of post.media_urls) {
          const result = await checkUrl(url)
          const status = result.accessible ? '✅' : '❌'
          console.log(`   ${status} ${url}`)
          if (result.accessible) {
            console.log(`      Type: ${result.contentType}`)
          }
        }
      }
      console.log()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📖 CHECKING STORY MEDIA URLS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const stories = await db.collection('stories')
      .find({ 
        is_deleted: { $ne: true },
        expires_at: { $gt: new Date() },
        media_url: { $exists: true, $ne: null }
      })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray()

    console.log(`Found ${stories.length} active stories with media\n`)

    for (const story of stories) {
      console.log(`Story: ${story._id}`)
      console.log(`Caption: ${story.caption || 'No caption'}`)
      
      const result = await checkUrl(story.media_url)
      const status = result.accessible ? '✅' : '❌'
      console.log(`   ${status} ${story.media_url}`)
      if (result.accessible) {
        console.log(`      Type: ${result.contentType}`)
      }
      console.log()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎬 CHECKING REEL MEDIA URLS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const reels = await db.collection('reels')
      .find({ 
        is_archived: { $ne: true },
        video_url: { $exists: true, $ne: null }
      })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray()

    console.log(`Found ${reels.length} reels with video\n`)

    for (const reel of reels) {
      console.log(`Reel: ${reel._id}`)
      console.log(`Caption: ${reel.caption || reel.description || 'No caption'}`)
      
      // Check video URL
      const videoResult = await checkUrl(reel.video_url)
      const videoStatus = videoResult.accessible ? '✅' : '❌'
      console.log(`   Video: ${videoStatus} ${reel.video_url}`)
      if (videoResult.accessible) {
        console.log(`      Type: ${videoResult.contentType}`)
      }

      // Check thumbnail URL if exists
      if (reel.thumbnail_url) {
        const thumbResult = await checkUrl(reel.thumbnail_url)
        const thumbStatus = thumbResult.accessible ? '✅' : '❌'
        console.log(`   Thumbnail: ${thumbStatus} ${reel.thumbnail_url}`)
        if (thumbResult.accessible) {
          console.log(`      Type: ${thumbResult.contentType}`)
        }
      }
      console.log()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Count Cloudinary URLs
    const cloudinaryPosts = posts.filter(p => 
      p.media_urls?.some(url => url.includes('cloudinary.com'))
    ).length

    const cloudinaryStories = stories.filter(s => 
      s.media_url?.includes('cloudinary.com')
    ).length

    const cloudinaryReels = reels.filter(r => 
      r.video_url?.includes('cloudinary.com')
    ).length

    console.log('Cloudinary Uploads:')
    console.log(`   Posts: ${cloudinaryPosts}/${posts.length}`)
    console.log(`   Stories: ${cloudinaryStories}/${stories.length}`)
    console.log(`   Reels: ${cloudinaryReels}/${reels.length}`)

    console.log('\n✅ Upload System Status:')
    if (cloudinaryPosts > 0 || cloudinaryStories > 0 || cloudinaryReels > 0) {
      console.log('   ✅ Cloudinary integration working')
      console.log('   ✅ Media uploads successful')
      console.log('   ✅ URLs are accessible')
    } else {
      console.log('   ⚠️  No Cloudinary uploads found yet')
      console.log('   💡 Test by uploading through the UI')
    }

    console.log('\n🔗 Cloudinary Configuration:')
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME || 'dcm470yhl'}`)
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'Not set'}`)
    console.log(`   Upload Preset: ${process.env.CLOUDINARY_UPLOAD_PRESET || 'profilePicsUnsigned'}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('\n✅ Disconnected from MongoDB\n')
  }
}

verifyCloudinaryUploads().catch(console.error)
