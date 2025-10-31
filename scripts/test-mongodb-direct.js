/**
 * Test MongoDB Connection Directly
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  console.log('\n🔍 Testing MongoDB Connection\n');
  console.log('='.repeat(50));
  
  try {
    console.log('\n📡 Connecting to MongoDB Atlas...');
    console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':***@'));
    
    // Set connection options
    mongoose.set('strictQuery', false);
    
    // Connect with timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test query
    console.log('\n🧪 Testing database query...');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const count = await User.countDocuments();
    console.log(`✅ Found ${count} users in database`);
    
    // Get one user
    const user = await User.findOne();
    if (user) {
      console.log('\n👤 Sample user:');
      console.log('  ID:', user._id);
      console.log('  Username:', user.username);
      console.log('  Email:', user.email);
    }
    
    console.log('\n✅ MongoDB is working perfectly!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS Resolution Failed');
      console.log('   - Check your internet connection');
      console.log('   - MongoDB Atlas might be blocked');
      console.log('   - Try using a VPN');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Connection Timeout');
      console.log('   - MongoDB Atlas is slow to respond');
      console.log('   - Check your internet speed');
      console.log('   - Try again in a few minutes');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication Failed');
      console.log('   - Check username/password in connection string');
      console.log('   - Verify MongoDB Atlas user permissions');
    }
    
    console.log('\n='.repeat(50));
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testConnection();
