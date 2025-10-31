/**
 * Create User and Generate Token
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';
const MONGODB_URI = 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';

async function createUserAndToken() {
  try {
    console.log('\n🔧 User & Token Creator\n');
    console.log('='.repeat(50));

    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User schema
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      name: String,
      bio: String,
      avatar: String,
      created_at: { type: Date, default: Date.now }
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Check if user exists
    console.log('\n👤 Checking for existing user...');
    let user = await User.findOne({ email: 'demo@example.com' });

    if (user) {
      console.log('✅ Found existing user:', user.username);
    } else {
      // Create new user
      console.log('📝 Creating new user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      user = await User.create({
        username: 'demouser',
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
        bio: 'This is a demo account for testing',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demouser'
      });

      console.log('✅ User created successfully!');
    }

    console.log('\nUser Details:');
    console.log('  ID:', user._id);
    console.log('  Username:', user.username);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);

    // Generate token
    console.log('\n🔑 Generating token...');
    const token = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: '30d' } // 30 days
    );

    console.log('✅ Token generated successfully!');
    console.log('\n📋 Your Token (valid for 30 days):');
    console.log('='.repeat(50));
    console.log(token);
    console.log('='.repeat(50));

    // Test token
    console.log('\n🔍 Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token is valid!');
    console.log('Decoded:', decoded);

    // Save to file for easy access
    const fs = require('fs');
    const tokenData = {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name
      },
      expiresIn: '30 days',
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync('token.json', JSON.stringify(tokenData, null, 2));
    console.log('\n💾 Token saved to: token.json');

    // Update fix-token-now.html
    console.log('\n📝 Updating fix-token-now.html...');
    let htmlContent = fs.readFileSync('public/fix-token-now.html', 'utf8');
    
    // Replace old token with new token
    const oldTokenPattern = /const TOKEN = '[^']+'/;
    htmlContent = htmlContent.replace(oldTokenPattern, `const TOKEN = '${token}'`);
    
    const tokenDisplayPattern = /<span id="tokenDisplay">[^<]+<\/span>/;
    htmlContent = htmlContent.replace(tokenDisplayPattern, `<span id="tokenDisplay">${token}</span>`);
    
    fs.writeFileSync('public/fix-token-now.html', htmlContent);
    console.log('✅ Updated fix-token-now.html with new token');

    console.log('\n📝 Instructions:');
    console.log('='.repeat(50));
    console.log('1. Open: http://localhost:3001/fix-token-now.html');
    console.log('2. Click "Fix Token Now"');
    console.log('3. Click "Test Token"');
    console.log('4. Click "Go to Create Post"');
    console.log('5. Create your post!');
    console.log('='.repeat(50));

    console.log('\n✅ All done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 11000) {
      console.log('\n💡 User already exists. Fetching existing user...');
      // Try to get existing user
      const User = mongoose.model('User');
      const user = await User.findOne({ email: 'demo@example.com' });
      if (user) {
        const token = jwt.sign(
          { userId: user._id.toString() },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        console.log('\n📋 Token for existing user:');
        console.log(token);
      }
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createUserAndToken();
