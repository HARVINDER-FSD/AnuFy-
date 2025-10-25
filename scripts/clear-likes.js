// Script to clear all likes from MongoDB Atlas
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';

async function clearLikes() {
  console.log('Connecting to MongoDB Atlas...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();

  console.log('Deleting all likes...');
  const result = await db.collection('likes').deleteMany({});
  console.log(`Deleted ${result.deletedCount} likes`);

  console.log('Deleting all reel likes...');
  const reelResult = await db.collection('reel_likes').deleteMany({});
  console.log(`Deleted ${reelResult.deletedCount} reel likes`);

  await client.close();
  console.log('Done! All likes cleared.');
  console.log('\nNow refresh your browser and try liking a post.');
}

clearLikes().catch(console.error);
