// Script to check likes in MongoDB Atlas
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';

async function checkLikes() {
    console.log('Connecting to MongoDB Atlas...');
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    console.log('Database name:', db.databaseName);
    console.log('\n--- Checking likes collection ---');
    
    const likes = await db.collection('likes').find({}).toArray();
    console.log(`Total likes in database: ${likes.length}`);
    
    if (likes.length > 0) {
        console.log('\nAll likes:');
        likes.forEach((like, index) => {
            console.log(`${index + 1}. Like ID: ${like._id}`);
            console.log(`   Post ID: ${like.post_id}`);
            console.log(`   User ID: ${like.user_id}`);
            console.log(`   Created: ${like.created_at}`);
            console.log('');
        });
    } else {
        console.log('No likes found in database!');
    }

    // Check if there are any triggers or change streams
    console.log('\n--- Checking collections ---');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));

    await client.close();
    console.log('\nDone!');
}

checkLikes().catch(console.error);
