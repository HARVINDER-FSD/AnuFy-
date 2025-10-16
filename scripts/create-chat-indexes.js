// MongoDB indexes for chat performance optimization
// Run this script once: node scripts/create-chat-indexes.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';

async function createIndexes() {
  console.log('Connecting to MongoDB...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();

  try {
    console.log('Creating indexes for messages collection...');
    
    // Index for fetching messages by conversation (most important)
    await db.collection('messages').createIndex(
      { conversation_id: 1, created_at: -1 },
      { name: 'conversation_messages_idx' }
    );
    
    // Index for unread messages
    await db.collection('messages').createIndex(
      { recipient_id: 1, is_read: 1, created_at: -1 },
      { name: 'unread_messages_idx' }
    );
    
    // Index for deleted messages filter
    await db.collection('messages').createIndex(
      { is_deleted: 1 },
      { name: 'deleted_messages_idx', sparse: true }
    );

    console.log('Creating indexes for conversations collection...');
    
    // Index for user conversations
    await db.collection('conversations').createIndex(
      { participants: 1, updated_at: -1 },
      { name: 'user_conversations_idx' }
    );
    
    // Index for conversation lookup
    await db.collection('conversations').createIndex(
      { _id: 1, participants: 1 },
      { name: 'conversation_participants_idx' }
    );

    console.log('✅ All indexes created successfully!');
    console.log('\nIndexes created:');
    console.log('- conversation_messages_idx: Fast message fetching');
    console.log('- unread_messages_idx: Quick unread count');
    console.log('- deleted_messages_idx: Filter deleted messages');
    console.log('- user_conversations_idx: Fast conversation list');
    console.log('- conversation_participants_idx: Quick participant check');
    
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

createIndexes().catch(console.error);
