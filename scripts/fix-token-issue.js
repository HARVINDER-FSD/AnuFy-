/**
 * Fix Token Issue - Test and regenerate valid tokens
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';
const MONGODB_URI = 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';

async function fixTokenIssue() {
  try {
    console.log('\n🔧 Token Issue Fixer\n');
    console.log('='.repeat(50));

    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get User model
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Find a test user
    console.log('\n👤 Finding test user...');
    const user = await User.findOne().select('_id username email');
    
    if (!user) {
      console.log('❌ No users found in database');
      console.log('💡 Please create a user first by registering');
      process.exit(1);
    }

    console.log('✅ Found user:', {
      id: user._id,
      username: user.username,
      email: user.email
    });

    // Generate new token
    console.log('\n🔑 Generating new token...');
    const token = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated successfully!');
    console.log('\n📋 Your new token:');
    console.log('='.repeat(50));
    console.log(token);
    console.log('='.repeat(50));

    // Verify the token works
    console.log('\n🔍 Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token is valid!');
    console.log('Decoded:', decoded);

    // Test with backend
    console.log('\n🧪 Testing token with backend...');
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:8000/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token works with backend!');
      console.log('User data:', data);
    } else {
      console.log('⚠️  Backend test failed:', response.status);
      const error = await response.text();
      console.log('Error:', error);
    }

    // Instructions
    console.log('\n📝 How to use this token:');
    console.log('='.repeat(50));
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Run these commands:');
    console.log('');
    console.log(`   localStorage.setItem('token', '${token}');`);
    console.log(`   document.cookie = 'client-token=${token}; path=/';`);
    console.log(`   document.cookie = 'token=${token}; path=/';`);
    console.log('');
    console.log('4. Refresh the page');
    console.log('5. Try creating a post again');
    console.log('='.repeat(50));

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixTokenIssue();
