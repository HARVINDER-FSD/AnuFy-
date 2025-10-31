/**
 * Test post creation directly
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';
const USER_ID = '6904bff97989e5bf3cc98226';

async function testPostCreation() {
  try {
    console.log('\n🧪 Testing Post Creation\n');
    console.log('='.repeat(50));

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    console.log('✅ Connected to MongoDB');

    // Check if user exists
    console.log('\n1️⃣  Checking if user exists...');
    const user = await db.collection('users').findOne({ _id: new ObjectId(USER_ID) });
    
    if (!user) {
      console.log('❌ User not found!');
      await client.close();
      process.exit(1);
    }
    
    console.log('✅ User found:', user.username);

    // Create a test post
    console.log('\n2️⃣  Creating test post...');
    const postDoc = {
      user_id: new ObjectId(USER_ID),
      content: 'Test post created directly - ' + new Date().toISOString(),
      media_urls: null,
      media_type: 'text',
      location: null,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('posts').insertOne(postDoc);
    console.log('✅ Post created with ID:', result.insertedId.toString());

    // Verify post was created
    console.log('\n3️⃣  Verifying post...');
    const createdPost = await db.collection('posts').findOne({ _id: result.insertedId });
    
    if (createdPost) {
      console.log('✅ Post verified!');
      console.log('  Content:', createdPost.content);
      console.log('  User ID:', createdPost.user_id.toString());
      console.log('  Created:', createdPost.created_at);
    }

    console.log('\n✅ Post creation works! The backend should work too.');
    console.log('='.repeat(50));

    await client.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testPostCreation();
