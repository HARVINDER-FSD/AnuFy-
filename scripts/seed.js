const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('posts').deleteMany({});
    await db.collection('stories').deleteMany({});
    await db.collection('reels').deleteMany({});
    await db.collection('follows').deleteMany({});
    await db.collection('likes').deleteMany({});
    await db.collection('comments').deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        full_name: 'John Doe',
        password_hash: hashedPassword,
        bio: 'Software developer and tech enthusiast',
        avatar_url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_crop,g_face,r_max/w_200/lady.jpg',
        is_verified: true,
        followers_count: 150,
        following_count: 75,
        posts_count: 12,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        full_name: 'Jane Smith',
        password_hash: hashedPassword,
        bio: 'Photographer and travel blogger',
        avatar_url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_crop,g_face,r_max/w_200/man.jpg',
        is_verified: false,
        followers_count: 89,
        following_count: 120,
        posts_count: 8,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'mike_wilson',
        email: 'mike@example.com',
        full_name: 'Mike Wilson',
        password_hash: hashedPassword,
        bio: 'Fitness coach and nutrition expert',
        avatar_url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_crop,g_face,r_max/w_200/woman.jpg',
        is_verified: true,
        followers_count: 234,
        following_count: 45,
        posts_count: 15,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    const userResult = await db.collection('users').insertMany(users);
    const userIds = Object.values(userResult.insertedIds);
    
    console.log(`Created ${users.length} users`);
    
    // Create sample posts
    const posts = [
      {
        user_id: userIds[0],
        caption: 'Just finished building an amazing new feature! 🚀 #coding #webdev',
        media_urls: ['https://res.cloudinary.com/demo/image/upload/w_800,h_600,c_fill/sample.jpg'],
        media_type: 'image',
        location: 'San Francisco, CA',
        likes_count: 23,
        comments_count: 5,
        is_archived: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        user_id: userIds[1],
        caption: 'Beautiful sunset from my recent trip to the mountains 🌅',
        media_urls: ['https://res.cloudinary.com/demo/image/upload/w_800,h_600,c_fill/sample.jpg'],
        media_type: 'image',
        location: 'Mountain View, CA',
        likes_count: 45,
        comments_count: 8,
        is_archived: false,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        user_id: userIds[2],
        caption: 'Morning workout complete! 💪 Remember, consistency is key to achieving your fitness goals.',
        media_urls: ['https://res.cloudinary.com/demo/image/upload/w_800,h_600,c_fill/sample.jpg'],
        media_type: 'image',
        location: 'Gym',
        likes_count: 67,
        comments_count: 12,
        is_archived: false,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];
    
    await db.collection('posts').insertMany(posts);
    console.log(`Created ${posts.length} posts`);
    
    // Create sample follows
    const follows = [
      { follower_id: userIds[0], following_id: userIds[1], created_at: new Date() },
      { follower_id: userIds[0], following_id: userIds[2], created_at: new Date() },
      { follower_id: userIds[1], following_id: userIds[0], created_at: new Date() },
      { follower_id: userIds[2], following_id: userIds[0], created_at: new Date() }
    ];
    
    await db.collection('follows').insertMany(follows);
    console.log(`Created ${follows.length} follow relationships`);
    
    // Create sample stories
    const stories = [
      {
        user_id: userIds[0],
        media_url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_600,c_fill/sample.jpg',
        media_type: 'image',
        caption: 'Working late tonight!',
        views_count: 12,
        is_deleted: false,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000) // 23 hours from now
      },
      {
        user_id: userIds[1],
        media_url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_600,c_fill/sample.jpg',
        media_type: 'image',
        caption: 'Coffee break ☕',
        views_count: 8,
        is_deleted: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        expires_at: new Date(Date.now() + 23.5 * 60 * 60 * 1000) // 23.5 hours from now
      }
    ];
    
    await db.collection('stories').insertMany(stories);
    console.log(`Created ${stories.length} stories`);
    
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
  }
}

seedDatabase();
