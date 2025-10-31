/**
 * Create user that matches the token
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://harvindersinghharvinder9999_db_user:sardar123@cluster0.ssl5fvx.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';
const USER_ID = '6904bff97989e5bf3cc98226'; // From the token

async function createUser() {
  try {
    console.log('\n🔧 Creating User for Token\n');
    console.log('='.repeat(50));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      name: String,
      full_name: String,
      bio: String,
      avatar: String,
      avatar_url: String,
      created_at: Date
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Check if user exists
    let user = await User.findById(USER_ID);

    if (user) {
      console.log('✅ User already exists!');
      console.log('  ID:', user._id);
      console.log('  Username:', user.username);
      console.log('  Email:', user.email);
    } else {
      // Create user with specific ID
      console.log('📝 Creating user with ID:', USER_ID);
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      user = new User({
        _id: new mongoose.Types.ObjectId(USER_ID),
        username: 'demouser',
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
        full_name: 'Demo User',
        bio: 'Demo account for testing',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demouser',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demouser',
        created_at: new Date()
      });

      await user.save();
      console.log('✅ User created successfully!');
    }

    console.log('\n📋 User Details:');
    console.log('  ID:', user._id.toString());
    console.log('  Username:', user.username);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name || user.full_name);

    console.log('\n✅ User is ready! Token will work now.');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createUser();
