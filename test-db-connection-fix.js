// Simple script to test database connection with retry logic
require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing database connection...');
console.log('Database URL:', process.env.DATABASE_URL ? 'Found (hidden for security)' : 'Not found');

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      console.log(`Attempt ${retries + 1}/${MAX_RETRIES + 1} to connect to database...`);
      const result = await pool.query('SELECT NOW()');
      console.log('Connection successful!');
      console.log('Current database time:', result.rows[0].now);
      return;
    } catch (error) {
      console.error('Connection error:', error.message);
      
      if (retries < MAX_RETRIES) {
        retries++;
        console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error('Failed to connect after maximum retries');
        break;
      }
    }
  }
}

testConnection()
  .then(() => pool.end())
  .catch(err => {
    console.error('Unhandled error:', err);
    pool.end();
  });