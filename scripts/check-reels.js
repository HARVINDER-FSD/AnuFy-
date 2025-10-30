const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkReels() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();

  console.log('Checking reels collection...\n');

  // Count total reels
  const totalReels = await db.collection('reels').countDocuments();
  console.log('Total reels:', totalReels);

  // Count reels with is_archived
  const archivedReels = await db.collection('reels').countDocuments({ is_archived: true });
  console.log('Archived reels:', archivedReels);

  // Count reels with is_deleted
  const deletedReels = await db.collection('reels').countDocuments({ is_deleted: true });
  console.log('Deleted reels:', deletedReels);

  // Get sample reels
  const sampleReels = await db.collection('reels').find().limit(3).toArray();
  console.log('\nSample reels:');
  sampleReels.forEach((reel, i) => {
    console.log(`\nReel ${i + 1}:`);
    console.log('  _id:', reel._id);
    console.log('  user_id:', reel.user_id);
    console.log('  video_url:', reel.video_url?.substring(0, 50) + '...');
    console.log('  caption:', reel.caption || reel.title || reel.description || 'No caption');
    console.log('  is_archived:', reel.is_archived);
    console.log('  is_deleted:', reel.is_deleted);
    console.log('  created_at:', reel.created_at);
  });

  await client.close();
}

checkReels().catch(console.error);
