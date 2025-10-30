/**
 * Debug script to check users in database
 * Run with: node scripts/check-users.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../api-server/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';

// User schema (simplified)
const userSchema = new mongoose.Schema({
  username: String,
  full_name: String,
  email: String,
  avatar_url: String,
  is_verified: Boolean,
  is_active: Boolean,
  followers_count: Number,
  following_count: Number,
  created_at: Date
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.substring(0, 50) + '...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}\n`);

    if (totalUsers === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 You need to create users first.');
      console.log('   Try registering at: http://localhost:3000/register\n');
    } else {
      // Get first 10 users
      const users = await User.find()
        .select('username full_name email is_active is_verified')
        .limit(10)
        .lean();

      console.log('👥 First 10 users:');
      console.log('─'.repeat(80));
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username || 'N/A'}`);
        console.log(`   Full Name: ${user.full_name || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Active: ${user.is_active !== false ? '✅' : '❌'}`);
        console.log(`   Verified: ${user.is_verified ? '✅' : '❌'}`);
        console.log('─'.repeat(80));
      });

      // Test search
      console.log('\n🔍 Testing search for "test":');
      const searchResults = await User.find({
        $or: [
          { username: { $regex: 'test', $options: 'i' } },
          { full_name: { $regex: 'test', $options: 'i' } }
        ]
      })
      .select('username full_name')
      .limit(5)
      .lean();

      if (searchResults.length > 0) {
        console.log(`✅ Found ${searchResults.length} users matching "test":`);
        searchResults.forEach(user => {
          console.log(`   - ${user.username} (${user.full_name})`);
        });
      } else {
        console.log('❌ No users found matching "test"');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
