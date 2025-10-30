require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function debugUserData() {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    console.log('\n=== DEBUGGING USER DATA ===\n');

    // Find user by username
    const user = await db.collection('users').findOne({ username: 'Its.harvinder.05' });

    if (!user) {
        console.log('User not found!');
        await client.close();
        return;
    }

    console.log('USER DATA:');
    console.log('- ID:', user._id.toString());
    console.log('- Username:', user.username);
    console.log('- Avatar field:', user.avatar ? 'EXISTS' : 'MISSING');
    console.log('- Avatar_url field:', user.avatar_url ? 'EXISTS' : 'MISSING');
    console.log('- Avatar value:', user.avatar || user.avatar_url || 'NONE');
    console.log('- Posts count field:', user.posts_count);
    console.log('');

    // Find posts - try different field names
    console.log('SEARCHING FOR POSTS:');

    const userId = user._id.toString();
    console.log('Looking for posts with user_id:', userId);

    // Try user_id as string
    let posts = await db.collection('posts').find({ user_id: userId }).toArray();
    console.log('- Posts with user_id (string):', posts.length);

    // Try user_id as ObjectId
    posts = await db.collection('posts').find({ user_id: user._id }).toArray();
    console.log('- Posts with user_id (ObjectId):', posts.length);

    // Try userId
    posts = await db.collection('posts').find({ userId: userId }).toArray();
    console.log('- Posts with userId (string):', posts.length);

    // Try userId as ObjectId
    posts = await db.collection('posts').find({ userId: user._id }).toArray();
    console.log('- Posts with userId (ObjectId):', posts.length);

    // Try author_id
    posts = await db.collection('posts').find({ author_id: userId }).toArray();
    console.log('- Posts with author_id (string):', posts.length);

    // Try author_id as ObjectId
    posts = await db.collection('posts').find({ author_id: user._id }).toArray();
    console.log('- Posts with author_id (ObjectId):', posts.length);

    // Get all posts to see structure
    console.log('\nALL POSTS IN DATABASE:');
    const allPosts = await db.collection('posts').find({}).limit(5).toArray();
    console.log('Total posts in database:', await db.collection('posts').countDocuments());

    if (allPosts.length > 0) {
        console.log('\nSample post structure:');
        const samplePost = allPosts[0];
        console.log('Fields:', Object.keys(samplePost));
        console.log('User ID field:', samplePost.user_id || samplePost.userId || samplePost.author_id || 'NOT FOUND');
        console.log('User ID type:', typeof (samplePost.user_id || samplePost.userId || samplePost.author_id));
        console.log('Full post:', JSON.stringify(samplePost, null, 2));
    }

    await client.close();
}

debugUserData().catch(console.error);
