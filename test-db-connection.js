// Quick script to test database connection
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const connectionString = process.env.DATABASE_URL;
  console.log('Connection string:', connectionString?.replace(/:[^:@]+@/, ':****@') || 'NOT FOUND');
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test connection
    console.log('\n1️⃣ Testing connection...');
    const client = await pool.connect();
    console.log('✅ Connection successful!\n');

    // Check PostgreSQL version
    console.log('2️⃣ Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log('✅ PostgreSQL version:', versionResult.rows[0].version.split(',')[0]);

    // Check if users table exists
    console.log('\n3️⃣ Checking if tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found! You need to run database-schema.sql');
      console.log('\nRun this command:');
      console.log('psql -U postgres -d postgres -f database-schema.sql');
    } else {
      console.log('✅ Found', tablesResult.rows.length, 'tables:');
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }

    // Check if users table has the correct structure
    if (tablesResult.rows.some(row => row.table_name === 'users')) {
      console.log('\n4️⃣ Checking users table structure...');
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      console.log('✅ Users table columns:');
      columnsResult.rows.forEach(row => {
        console.log('   -', row.column_name, ':', row.data_type);
      });

      // Check if there are any users
      console.log('\n5️⃣ Checking existing users...');
      const usersResult = await client.query('SELECT COUNT(*) FROM users');
      console.log('✅ Total users:', usersResult.rows[0].count);
    }

    client.release();
    console.log('\n✅ All checks passed! Database is ready.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n🔧 FIX: Password authentication failed');
      console.log('Your PostgreSQL password is incorrect.');
      console.log('Check FIX_DATABASE_CONNECTION.md for solutions.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 FIX: Connection refused');
      console.log('PostgreSQL is not running or wrong host/port.');
      console.log('Start PostgreSQL: net start postgresql-x64-16');
    } else if (error.code === '3D000') {
      console.log('\n🔧 FIX: Database does not exist');
      console.log('Create the database first:');
      console.log('psql -U postgres -c "CREATE DATABASE socialmedia"');
    } else if (error.code === '42P01') {
      console.log('\n🔧 FIX: Table does not exist');
      console.log('Run the database schema:');
      console.log('psql -U postgres -d postgres -f database-schema.sql');
    }
    
    console.log('\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
