// Script to check MongoDB Atlas configuration for likes collection
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';

async function checkConfig() {
    console.log('Connecting to MongoDB Atlas...');
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    console.log('Database name:', db.databaseName);
    console.log('\n=== Checking likes collection configuration ===\n');
    
    // Check indexes (including TTL indexes)
    const indexes = await db.collection('likes').indexes();
    console.log('Indexes on likes collection:');
    indexes.forEach(index => {
        console.log('- Index:', index.name);
        console.log('  Keys:', JSON.stringify(index.key));
        if (index.expireAfterSeconds !== undefined) {
            console.log('  ⚠️  TTL INDEX FOUND! Expires after:', index.expireAfterSeconds, 'seconds');
        }
        console.log('');
    });

    // Check collection options
    const collections = await db.listCollections({ name: 'likes' }).toArray();
    if (collections.length > 0) {
        console.log('Collection options:', JSON.stringify(collections[0].options, null, 2));
    }

    // Try to insert a test like and verify it persists
    console.log('\n=== Testing write persistence ===\n');
    const testLike = {
        post_id: new (require('mongodb').ObjectId)(),
        user_id: new (require('mongodb').ObjectId)(),
        created_at: new Date(),
        test: true
    };

    console.log('Inserting test like...');
    const insertResult = await db.collection('likes').insertOne(testLike);
    console.log('Insert acknowledged:', insertResult.acknowledged);
    console.log('Inserted ID:', insertResult.insertedId);

    // Wait 2 seconds
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if it still exists
    const foundLike = await db.collection('likes').findOne({ _id: insertResult.insertedId });
    if (foundLike) {
        console.log('✅ Test like still exists after 2 seconds');
    } else {
        console.log('❌ Test like was DELETED! Something is removing likes automatically!');
    }

    // Clean up test like
    await db.collection('likes').deleteOne({ _id: insertResult.insertedId });
    console.log('\nTest like cleaned up');

    await client.close();
    console.log('\nDone!');
}

checkConfig().catch(console.error);
