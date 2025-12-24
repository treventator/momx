const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Redis client configuration
 * REDIS_URL environment variable format: redis://user:password@host:port
 */
const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  keyPrefix: process.env.REDIS_PREFIX || 'momx:',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Use REDIS_URL if available, otherwise use individual settings
const redisUrl = process.env.REDIS_URL;
let redisClient;

// Redis cache is optional - if not configured, use a mock implementation
const mockRedis = {
  get: async () => null,
  set: async () => true,
  del: async () => true,
  flushdb: async () => true,
  keys: async () => [],
  exists: async () => 0,
  quit: async () => true
};

try {
  if (!process.env.CACHE_ENABLED || process.env.CACHE_ENABLED !== 'true') {
    logger.info('Redis cache is disabled');
    redisClient = mockRedis;
  } else if (redisUrl) {
    logger.info('Connecting to Redis with URL');
    redisClient = new Redis(redisUrl);
  } else {
    logger.info(`Connecting to Redis at ${config.host}:${config.port}`);
    redisClient = new Redis(config);
  }

  // Connection events
  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
    
    // If redis is required, fail hard, otherwise, fallback to mock
    if (process.env.REDIS_REQUIRED === 'true') {
      process.exit(1);
    } else {
      logger.warn('Using mock Redis implementation');
      redisClient = mockRedis;
    }
  });
} catch (error) {
  logger.error('Redis initialization error:', error);
  
  // If redis is required, fail hard, otherwise, fallback to mock
  if (process.env.REDIS_REQUIRED === 'true') {
    process.exit(1);
  } else {
    logger.warn('Using mock Redis implementation');
    redisClient = mockRedis;
  }
}

/**
 * Redis client wrapper with additional methods
 */
const redis = {
  /**
   * Get a value from Redis
   * @param {string} key - The key to get
   * @returns {Promise<any>} The value or null if not found
   */
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? value : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a value in Redis
   * @param {string} key - The key to set
   * @param {any} value - The value to set
   * @param {string} [flag='EX'] - The flag for expiration (EX, PX)
   * @param {number} [time=300] - The expiration time (in seconds for EX, milliseconds for PX)
   * @returns {Promise<boolean>} True if successful
   */
  set: async (key, value, flag = 'EX', time = 300) => {
    try {
      await redisClient.set(key, value, flag, time);
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete a key from Redis
   * @param {string} key - The key to delete
   * @returns {Promise<boolean>} True if successful
   */
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis del error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all keys from Redis
   * @returns {Promise<boolean>} True if successful
   */
  flushdb: async () => {
    try {
      await redisClient.flushdb();
      return true;
    } catch (error) {
      logger.error('Redis flushdb error:', error);
      return false;
    }
  },

  /**
   * Get all keys matching a pattern
   * @param {string} pattern - The pattern to match
   * @returns {Promise<string[]>} Array of keys
   */
  keys: async (pattern) => {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error(`Redis keys error for pattern ${pattern}:`, error);
      return [];
    }
  },

  /**
   * Check if a key exists
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} True if the key exists
   */
  exists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Invalidate all cache for a specific prefix
   * @param {string} prefix - The prefix to match
   * @returns {Promise<boolean>} True if successful
   */
  invalidateByPrefix: async (prefix) => {
    try {
      const keys = await redisClient.keys(`${config.keyPrefix}${prefix}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis invalidateByPrefix error for prefix ${prefix}:`, error);
      return false;
    }
  },

  /**
   * Close the Redis connection
   * @returns {Promise<boolean>} True if successful
   */
  quit: async () => {
    try {
      if (redisClient !== mockRedis) {
        await redisClient.quit();
      }
      return true;
    } catch (error) {
      logger.error('Redis quit error:', error);
      return false;
    }
  }
};

module.exports = redis; 