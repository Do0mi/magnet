/**
 * Redis Configuration for Currency Service (Optional)
 * 
 * This file shows how to configure Redis for distributed caching.
 * Redis is useful when running multiple server instances or when you need
 * persistent cache across server restarts.
 * 
 * USAGE:
 * 1. Install Redis: npm install redis
 * 2. Start Redis server
 * 3. In your index.js, require this file and call configureRedis()
 * 
 * @module services/currency-service-redis
 */

// Uncomment and configure if you want to use Redis
/*
const redis = require('redis');
const { setRedisClient } = require('./currency-service');

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Optional: Add retry strategy
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('[Redis] Connection refused, falling back to in-memory cache');
      return null; // Don't retry, fall back to in-memory
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('[Redis] Retry time exhausted, falling back to in-memory cache');
      return null;
    }
    if (options.attempt > 10) {
      console.error('[Redis] Max retries reached, falling back to in-memory cache');
      return null;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('[Redis] Connected to Redis server');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
  console.log('[Redis] Falling back to in-memory cache');
});

redisClient.on('ready', () => {
  console.log('[Redis] Redis client ready');
  // Set Redis client in currency service
  setRedisClient(redisClient);
});

// Connect to Redis
redisClient.connect().catch(err => {
  console.error('[Redis] Failed to connect:', err.message);
  console.log('[Redis] Using in-memory cache instead');
});

module.exports = { redisClient };
*/

// If not using Redis, export empty object
module.exports = {};

