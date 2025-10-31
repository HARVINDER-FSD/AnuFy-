#!/usr/bin/env node

/**
 * Create a test user for testing
 */

require('dotenv').config({ path: 'api-server/.env', override: true })
const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

async function createTestUser() {
  console.log('Creating test user...\n')

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db()

  try {
    // Check if test user 2 already exists
    const existing = await db.collection('users').findOne({ username: 'testuser2' })
    
    if (existing) {
      console.log('✅ Test user 2 already exists')
      console.log(`   Username: ${existing.username}`)
      console.log(`   ID: ${existing._id}\n`)
      return
    }

    // Create test user 2
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const testUser = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: hashedPassword,
      full_name: 'Test User 2',
      bio: 'Second test user for testing',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser2',
      is_verified: false,
      is_active: true,
      is_private: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    const result = await db.collection('users').insertOne(testUser)
    
    console.log('✅ Test user 2 created successfully!')
    console.log(`   Username: ${testUser.username}`)
    console.log(`   Email: ${testUser.email}`)
    console.log(`   Password: password123`)
    console.log(`   ID: ${result.insertedId}\n`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

createTestUser().catch(console.error)
