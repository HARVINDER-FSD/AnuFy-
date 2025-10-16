import { MongoClient, Db } from "mongodb"
import { Redis } from "@upstash/redis"

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Get MongoDB client and database
export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('MongoDB connection established successfully');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Export a function to get the database
export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export const redisPub = redis
export const redisSub = redis

// Check if Redis is available
const isRedisAvailable = !!redis

// MongoDB query helper with error handling and retry logic
export async function query(collectionName: string, operation: (collection: any) => Promise<any>) {
  const start = Date.now();
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const db = await getDatabase();
      const collection = db.collection(collectionName);
      const result = await operation(collection);
      const duration = Date.now() - start;
      console.log("Executed MongoDB operation", { collection: collectionName, duration });
      return result;
    } catch (error: any) {
      const isConnectionError = error.message && (
        error.message.includes('timeout') || 
        error.message.includes('terminated') ||
        error.message.includes('connection')
      );
      
      if (isConnectionError && retries < MAX_RETRIES) {
        retries++;
        console.log(`Database connection error, retrying (${retries}/${MAX_RETRIES})...`);
        // Reset cached connection
        cachedClient = null;
        cachedDb = null;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error("Database query error:", error);
      throw error;
    }
  }
  
  console.error("Database query failed after maximum retries");
  throw new Error("Database connection failed after multiple attempts");
}

// MongoDB transaction helper
export async function transaction<T>(callback: (session: any) => Promise<T>): Promise<T> {
  const { client } = await connectToDatabase();
  const session = client.startSession();
  
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export const cache = {
  async get(key: string) {
    if (!redis) {
      console.warn("Redis not available, skipping cache get")
      return null
    }
    try {
      const value = await redis.get(key)
      return value ? (typeof value === "string" ? JSON.parse(value) : value) : null
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  },

  async set(key: string, value: any, ttl = 3600) {
    if (!redis) {
      console.warn("Redis not available, skipping cache set")
      return
    }
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error("Cache set error:", error)
    }
  },

  async del(key: string) {
    if (!redis) {
      console.warn("Redis not available, skipping cache delete")
      return
    }
    try {
      await redis.del(key)
    } catch (error) {
      console.error("Cache delete error:", error)
    }
  },

  async invalidatePattern(pattern: string) {
    if (!redis) {
      console.warn("Redis not available, skipping cache invalidate")
      return
    }
    try {
      // Note: Upstash Redis REST API doesn't support KEYS command
      // For pattern invalidation, we'll need to track keys manually
      console.warn("Pattern invalidation not supported with Upstash REST API")
    } catch (error) {
      console.error("Cache invalidate pattern error:", error)
    }
  },
}
