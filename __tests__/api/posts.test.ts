import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/socialmedia_test';
const JWT_SECRET = 'test-secret';

describe('Posts API', () => {
  let client: MongoClient;
  let testUserId: string;
  let testToken: string;

  beforeAll(async () => {
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Create test user
    const userResult = await db.collection('users').insertOne({
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      password_hash: 'hashedpassword',
      created_at: new Date()
    });
    
    testUserId = userResult.insertedId.toString();
    testToken = jwt.sign({ userId: testUserId }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    if (client) {
      const db = client.db();
      await db.collection('users').deleteMany({});
      await db.collection('posts').deleteMany({});
      await client.close();
    }
  });

  describe('GET /api/posts', () => {
    it('should return posts without authentication', async () => {
      const response = await fetch('http://localhost:3000/api/posts');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return posts with pagination', async () => {
      const response = await fetch('http://localhost:3000/api/posts?limit=5&offset=0');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post with valid authentication', async () => {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify({
          content: 'Test post content',
          media_type: 'text'
        })
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('user_id', testUserId);
      expect(data).toHaveProperty('caption', 'Test post content');
    });

    it('should reject post creation without authentication', async () => {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: 'Test post content'
        })
      });

      expect(response.status).toBe(401);
    });

    it('should reject post creation with invalid token', async () => {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({
          content: 'Test post content'
        })
      });

      expect(response.status).toBe(401);
    });

    it('should reject post creation without content', async () => {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
    });
  });
});
