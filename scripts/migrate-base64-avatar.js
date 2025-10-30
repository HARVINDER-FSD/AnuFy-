/**
 * Migration Script: Convert Base64 Avatar to Cloudinary URL
 * 
 * This script finds users with base64 avatars and uploads them to Cloudinary
 */

const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const FormData = require('form-data');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harvindersingh78600:Harvinder%4012345@cluster0.mongodb.net/socialmedia?retryWrites=true&w=majority&appName=Cluster0';
const CLOUDINARY_CLOUD_NAME = 'dcm470yhl';
const CLOUDINARY_UPLOAD_PRESET = 'profilePicsUnsigned';

async function migrateBase64Avatars() {
  console.log('🚀 Starting base64 avatar migration...\n');

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();
  
  try {
    // Find all users with base64 avatars
    const users = await db.collection('users').find({
      $or: [
        { avatar: { $regex: '^data:image' } },
        { avatar_url: { $regex: '^data:image' } }
      ]
    }).toArray();

    console.log(`Found ${users.length} user(s) with base64 avatars\n`);

    for (const user of users) {
      console.log(`Processing user: ${user.username} (${user._id})`);
      
      const base64Avatar = user.avatar || user.avatar_url;
      
      if (!base64Avatar || !base64Avatar.startsWith('data:image')) {
        console.log('  ⚠️  No valid base64 avatar found, skipping\n');
        continue;
      }

      try {
        // Extract base64 data
        const matches = base64Avatar.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          console.log('  ⚠️  Invalid base64 format, skipping\n');
          continue;
        }

        const imageType = matches[1];
        const base64Data = matches[2];
        
        console.log(`  📤 Uploading ${imageType} image to Cloudinary...`);

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create form data
        const formData = new FormData();
        formData.append('file', buffer, {
          filename: `${user._id}.${imageType}`,
          contentType: `image/${imageType}`
        });
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'social-media');
        formData.append('public_id', `${user._id}_${Date.now()}`);

        // Upload to Cloudinary
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!uploadResponse.ok) {
          const error = await uploadResponse.text();
          console.log(`  ❌ Upload failed: ${error}\n`);
          continue;
        }

        const uploadResult = await uploadResponse.json();
        const cloudinaryUrl = uploadResult.secure_url;
        
        console.log(`  ✅ Uploaded successfully!`);
        console.log(`  🔗 URL: ${cloudinaryUrl}`);

        // Update database
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              avatar: cloudinaryUrl,
              avatar_url: cloudinaryUrl,
              updatedAt: new Date()
            }
          }
        );

        console.log(`  💾 Database updated!\n`);

      } catch (error) {
        console.error(`  ❌ Error processing user ${user.username}:`, error.message, '\n');
      }
    }

    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run migration
migrateBase64Avatars().catch(console.error);
