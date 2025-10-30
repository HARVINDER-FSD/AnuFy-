const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('Connection String:', MONGODB_URI ? MONGODB_URI.substring(0, 50) + '...' : 'NOT FOUND');
console.log('');

async function testConnection() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const db = client.db();
    console.log('Database name:', db.databaseName);
    
    // Test ping
    const pingResult = await db.admin().ping();
    console.log('✅ Ping successful:', pingResult);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('✅ Collections found:', collections.length);
    collections.forEach(col => console.log('  -', col.name));
    
    // Test users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log('✅ Users count:', usersCount);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('');
    console.error('Possible solutions:');
    console.error('1. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
    console.error('2. Verify username and password are correct');
    console.error('3. Check if cluster is active in MongoDB Atlas');
    console.error('4. Try using a different network/VPN');
  } finally {
    await client.close();
  }
}

testConnection();
