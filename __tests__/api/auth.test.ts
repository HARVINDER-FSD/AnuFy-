import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/socialmedia_test';

describe('Authentication API', () => {
  let client: MongoClient;

  beforeAll(async () => {
    client = await MongoClient.connect(MONGODB_URI);
  });

  afterAll(async () => {
    if (client) {
      const db = client.db();
      await db.collection('users').deleteMany({});
      await client.close();
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          full_name: 'New User'
        })
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('message', 'User registered successfully');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('username', 'newuser');
      expect(data.user).toHaveProperty('email', 'newuser@example.com');
    });

    it('should reject registration with existing username', async () => {
      // First registration
      await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123',
          full_name: 'Existing User'
        })
      });

      // Second registration with same username
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'existinguser',
          email: 'different@example.com',
          password: 'password123',
          full_name: 'Different User'
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('message');
    });

    it('should reject registration with missing fields', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'incompleteuser'
          // Missing email, password, full_name
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      const db = client.db();
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      
      await db.collection('users').insertOne({
        username: 'logintest',
        email: 'logintest@example.com',
        password_hash: hashedPassword,
        full_name: 'Login Test User',
        created_at: new Date()
      });
    });

    it('should login with valid credentials', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'logintest@example.com',
          password: 'testpassword'
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('message', 'Login successful');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('username', 'logintest');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'logintest@example.com',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('message');
    });

    it('should reject login with non-existent user', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('message', 'Logout successful');
    });
  });
});
