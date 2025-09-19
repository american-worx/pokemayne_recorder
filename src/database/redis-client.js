import Redis from 'ioredis';
import logger from '../core/utils/logger.js';

class RedisClient {
  constructor(options = {}) {
    this.options = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || process.env.REDIS_PORT || 6379,
      password: options.password || process.env.REDIS_PASSWORD || null,
      db: options.db || process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      ...options
    };

    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new Redis(this.options);

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully', {
          host: this.options.host,
          port: this.options.port,
          db: this.options.db
        });
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error:', error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.info('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Test connection
      await this.client.ping();
      logger.info('Redis client initialized successfully');

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  // Key-Value Operations
  async set(key, value, expireInSeconds = null) {
    try {
      const serializedValue = JSON.stringify(value);
      if (expireInSeconds) {
        return await this.client.setex(key, expireInSeconds, serializedValue);
      }
      return await this.client.set(key, serializedValue);
    } catch (error) {
      logger.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Failed to get key ${key}:`, error);
      throw error;
    }
  }

  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key) === 1;
    } catch (error) {
      logger.error(`Failed to check existence of key ${key}:`, error);
      throw error;
    }
  }

  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`Failed to set expiration for key ${key}:`, error);
      throw error;
    }
  }

  // Hash Operations
  async hset(key, field, value) {
    try {
      const serializedValue = JSON.stringify(value);
      return await this.client.hset(key, field, serializedValue);
    } catch (error) {
      logger.error(`Failed to hset ${key}.${field}:`, error);
      throw error;
    }
  }

  async hget(key, field) {
    try {
      const value = await this.client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Failed to hget ${key}.${field}:`, error);
      throw error;
    }
  }

  async hgetall(key) {
    try {
      const hash = await this.client.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error(`Failed to hgetall ${key}:`, error);
      throw error;
    }
  }

  async hdel(key, field) {
    try {
      return await this.client.hdel(key, field);
    } catch (error) {
      logger.error(`Failed to hdel ${key}.${field}:`, error);
      throw error;
    }
  }

  async hkeys(key) {
    try {
      return await this.client.hkeys(key);
    } catch (error) {
      logger.error(`Failed to hkeys ${key}:`, error);
      throw error;
    }
  }

  // List Operations
  async lpush(key, ...values) {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.client.lpush(key, ...serializedValues);
    } catch (error) {
      logger.error(`Failed to lpush to ${key}:`, error);
      throw error;
    }
  }

  async rpush(key, ...values) {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.client.rpush(key, ...serializedValues);
    } catch (error) {
      logger.error(`Failed to rpush to ${key}:`, error);
      throw error;
    }
  }

  async lpop(key) {
    try {
      const value = await this.client.lpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Failed to lpop from ${key}:`, error);
      throw error;
    }
  }

  async rpop(key) {
    try {
      const value = await this.client.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Failed to rpop from ${key}:`, error);
      throw error;
    }
  }

  async lrange(key, start = 0, stop = -1) {
    try {
      const values = await this.client.lrange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      logger.error(`Failed to lrange ${key}:`, error);
      throw error;
    }
  }

  async llen(key) {
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error(`Failed to llen ${key}:`, error);
      throw error;
    }
  }

  // Set Operations
  async sadd(key, ...members) {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await this.client.sadd(key, ...serializedMembers);
    } catch (error) {
      logger.error(`Failed to sadd to ${key}:`, error);
      throw error;
    }
  }

  async smembers(key) {
    try {
      const members = await this.client.smembers(key);
      return members.map(m => JSON.parse(m));
    } catch (error) {
      logger.error(`Failed to smembers ${key}:`, error);
      throw error;
    }
  }

  async srem(key, ...members) {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await this.client.srem(key, ...serializedMembers);
    } catch (error) {
      logger.error(`Failed to srem from ${key}:`, error);
      throw error;
    }
  }

  // Pattern Operations
  async keys(pattern) {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Failed to get keys with pattern ${pattern}:`, error);
      throw error;
    }
  }

  async scan(cursor = 0, pattern = '*', count = 10) {
    try {
      return await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
    } catch (error) {
      logger.error(`Failed to scan with pattern ${pattern}:`, error);
      throw error;
    }
  }

  // Utility Methods
  async flushdb() {
    try {
      return await this.client.flushdb();
    } catch (error) {
      logger.error('Failed to flush database:', error);
      throw error;
    }
  }

  async ping() {
    try {
      return await this.client.ping();
    } catch (error) {
      logger.error('Failed to ping Redis:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      host: this.options.host,
      port: this.options.port,
      db: this.options.db
    };
  }
}

// Singleton instance
let redisInstance = null;

export const getRedisClient = async (options = {}) => {
  if (!redisInstance) {
    redisInstance = new RedisClient(options);
    await redisInstance.connect();
  }
  return redisInstance;
};

export default RedisClient;