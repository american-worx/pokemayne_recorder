import { getRedisClient } from './redis-client.js';
import logger from '../core/utils/logger.js';
import Product from '../models/Product.js';
import Retailer from '../models/Retailer.js';
import Flow from '../models/Flow.js';
import UserProfile from '../models/UserProfile.js';
import Log from '../models/Log.js';

class DatabaseRepository {
  constructor(options = {}) {
    this.options = {
      cacheEnabled: options.cacheEnabled ?? true,
      cacheTimeout: options.cacheTimeout || 300000, // 5 minutes
      maxCacheSize: options.maxCacheSize || 1000,
      autoSave: options.autoSave ?? false,
      ...options
    };

    // In-memory cache
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.pendingWrites = new Map();
    this.redisClient = null;

    // Event listeners for auto-save
    this.listeners = {
      beforeSave: [],
      afterSave: [],
      beforeLoad: [],
      afterLoad: []
    };
  }

  async initialize() {
    try {
      this.redisClient = await getRedisClient();
      logger.info('Database repository initialized successfully');
      return this;
    } catch (error) {
      logger.error('Failed to initialize database repository:', error);
      throw error;
    }
  }

  // Event management
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Cache management
  isCacheValid(key) {
    if (!this.options.cacheEnabled || !this.cache.has(key)) {
      return false;
    }

    const timestamp = this.cacheTimestamps.get(key);
    return timestamp && (Date.now() - timestamp) < this.options.cacheTimeout;
  }

  setCache(key, value) {
    if (!this.options.cacheEnabled) return;

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.options.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }

    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  getCache(key) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key);
    }
    return null;
  }

  invalidateCache(pattern = null) {
    if (pattern) {
      // Invalidate specific pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.cacheTimestamps.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
      this.cacheTimestamps.clear();
    }
    logger.debug('Cache invalidated', { pattern });
  }

  // Generic CRUD operations
  async save(entity, options = {}) {
    const { skipCache = false, immediate = false } = options;

    try {
      this.emit('beforeSave', { entity, options });

      const key = this.getEntityKey(entity);
      const data = entity.toJSON();

      // Update cache immediately
      if (!skipCache) {
        this.setCache(key, data);
      }

      if (immediate || !this.options.autoSave) {
        // Save to Redis immediately
        await this.redisClient.set(key, data);
        await this.updateIndexes(entity, 'save');
        logger.debug(`Entity saved to database: ${key}`);
      } else {
        // Add to pending writes for batch processing
        this.pendingWrites.set(key, { entity, data, action: 'save' });
      }

      this.emit('afterSave', { entity, options });
      return entity;
    } catch (error) {
      logger.error(`Failed to save entity ${entity.id}:`, error);
      throw error;
    }
  }

  async load(entityType, id, options = {}) {
    const { skipCache = false } = options;

    try {
      this.emit('beforeLoad', { entityType, id, options });

      const key = this.getKeyForType(entityType, id);

      // Check cache first
      if (!skipCache) {
        const cached = this.getCache(key);
        if (cached) {
          const entity = this.createEntityFromData(entityType, cached);
          logger.debug(`Entity loaded from cache: ${key}`);
          return entity;
        }
      }

      // Load from Redis
      const data = await this.redisClient.get(key);
      if (!data) {
        return null;
      }

      const entity = this.createEntityFromData(entityType, data);

      // Update cache
      if (!skipCache) {
        this.setCache(key, data);
      }

      this.emit('afterLoad', { entity, options });
      logger.debug(`Entity loaded from database: ${key}`);
      return entity;
    } catch (error) {
      logger.error(`Failed to load entity ${entityType}:${id}:`, error);
      throw error;
    }
  }

  async delete(entityType, id, options = {}) {
    const { skipCache = false } = options;

    try {
      const key = this.getKeyForType(entityType, id);

      // Remove from cache
      if (!skipCache) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }

      // Remove from Redis
      await this.redisClient.del(key);

      // Update indexes
      const entity = { id, constructor: { name: entityType } };
      await this.updateIndexes(entity, 'delete');

      logger.debug(`Entity deleted: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete entity ${entityType}:${id}:`, error);
      throw error;
    }
  }

  async exists(entityType, id) {
    try {
      const key = this.getKeyForType(entityType, id);

      // Check cache first
      if (this.isCacheValid(key)) {
        return true;
      }

      // Check Redis
      return await this.redisClient.exists(key);
    } catch (error) {
      logger.error(`Failed to check existence of ${entityType}:${id}:`, error);
      throw error;
    }
  }

  // Specialized entity methods
  async saveProduct(product, options = {}) {
    product.updatedAt = new Date().toISOString();
    return this.save(product, options);
  }

  async loadProduct(id, options = {}) {
    return this.load('Product', id, options);
  }

  async saveRetailer(retailer, options = {}) {
    retailer.updatedAt = new Date().toISOString();
    return this.save(retailer, options);
  }

  async loadRetailer(id, options = {}) {
    return this.load('Retailer', id, options);
  }

  async saveFlow(flow, options = {}) {
    flow.updatedAt = new Date().toISOString();
    return this.save(flow, options);
  }

  async loadFlow(id, options = {}) {
    return this.load('Flow', id, options);
  }

  async saveUserProfile(userProfile, options = {}) {
    userProfile.updatedAt = new Date().toISOString();
    return this.save(userProfile, options);
  }

  async loadUserProfile(id, options = {}) {
    return this.load('UserProfile', id, options);
  }

  async saveLog(log, options = {}) {
    return this.save(log, options);
  }

  async loadLog(id, options = {}) {
    return this.load('Log', id, options);
  }

  // Query methods
  async findProductsByRetailer(retailerId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    try {
      const setKey = Product.getRetailerProductsKey(retailerId);
      const productIds = await this.redisClient.smembers(setKey);

      const products = [];
      const paginatedIds = productIds.slice(offset, offset + limit);

      for (const productId of paginatedIds) {
        const product = await this.loadProduct(productId);
        if (product) {
          products.push(product);
        }
      }

      return products;
    } catch (error) {
      logger.error(`Failed to find products by retailer ${retailerId}:`, error);
      throw error;
    }
  }

  async findFlowsByRetailer(retailerId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    try {
      const setKey = Flow.getRetailerFlowsKey(retailerId);
      const flowIds = await this.redisClient.smembers(setKey);

      const flows = [];
      const paginatedIds = flowIds.slice(offset, offset + limit);

      for (const flowId of paginatedIds) {
        const flow = await this.loadFlow(flowId);
        if (flow) {
          flows.push(flow);
        }
      }

      return flows;
    } catch (error) {
      logger.error(`Failed to find flows by retailer ${retailerId}:`, error);
      throw error;
    }
  }

  async findLogsByCategory(category, options = {}) {
    const { limit = 100, offset = 0 } = options;

    try {
      const listKey = Log.getCategoryLogsKey(category);
      const logIds = await this.redisClient.lrange(listKey, offset, offset + limit - 1);

      const logs = [];
      for (const logId of logIds) {
        const log = await this.loadLog(logId);
        if (log) {
          logs.push(log);
        }
      }

      return logs;
    } catch (error) {
      logger.error(`Failed to find logs by category ${category}:`, error);
      throw error;
    }
  }

  async findRecentLogs(options = {}) {
    const { limit = 50 } = options;

    try {
      const listKey = Log.getRecentLogsKey();
      const logIds = await this.redisClient.lrange(listKey, 0, limit - 1);

      const logs = [];
      for (const logId of logIds) {
        const log = await this.loadLog(logId);
        if (log) {
          logs.push(log);
        }
      }

      return logs;
    } catch (error) {
      logger.error('Failed to find recent logs:', error);
      throw error;
    }
  }

  // Batch operations
  async saveBatch(entities, options = {}) {
    const results = [];

    for (const entity of entities) {
      try {
        const result = await this.save(entity, options);
        results.push({ success: true, entity: result });
      } catch (error) {
        results.push({ success: false, entity, error });
      }
    }

    return results;
  }

  async flushPendingWrites() {
    if (this.pendingWrites.size === 0) {
      return;
    }

    logger.debug(`Flushing ${this.pendingWrites.size} pending writes`);

    const pipeline = this.redisClient.client.pipeline();

    for (const [key, { data }] of this.pendingWrites) {
      pipeline.set(key, JSON.stringify(data));
    }

    try {
      await pipeline.exec();

      // Update indexes
      for (const [, { entity, action }] of this.pendingWrites) {
        await this.updateIndexes(entity, action);
      }

      this.pendingWrites.clear();
      logger.debug('Pending writes flushed successfully');
    } catch (error) {
      logger.error('Failed to flush pending writes:', error);
      throw error;
    }
  }

  // Index management
  async updateIndexes(entity, action) {
    try {
      const entityType = entity.constructor.name;

      switch (entityType) {
        case 'Product':
          await this.updateProductIndexes(entity, action);
          break;
        case 'Flow':
          await this.updateFlowIndexes(entity, action);
          break;
        case 'Log':
          await this.updateLogIndexes(entity, action);
          break;
        case 'Retailer':
          await this.updateRetailerIndexes(entity, action);
          break;
      }
    } catch (error) {
      logger.error(`Failed to update indexes for ${entity.id}:`, error);
    }
  }

  async updateProductIndexes(product, action) {
    if (action === 'save' && product.retailer) {
      const setKey = Product.getRetailerProductsKey(product.retailer);
      await this.redisClient.sadd(setKey, product.id);

      if (product.category) {
        const categoryKey = Product.getCategoryProductsKey(product.category);
        await this.redisClient.sadd(categoryKey, product.id);
      }
    } else if (action === 'delete') {
      if (product.retailer) {
        const setKey = Product.getRetailerProductsKey(product.retailer);
        await this.redisClient.srem(setKey, product.id);
      }
    }
  }

  async updateFlowIndexes(flow, action) {
    if (action === 'save' && flow.retailer) {
      const setKey = Flow.getRetailerFlowsKey(flow.retailer);
      await this.redisClient.sadd(setKey, flow.id);

      if (flow.isActive) {
        const activeKey = Flow.getActiveFlowsKey();
        await this.redisClient.sadd(activeKey, flow.id);
      }
    } else if (action === 'delete') {
      if (flow.retailer) {
        const setKey = Flow.getRetailerFlowsKey(flow.retailer);
        await this.redisClient.srem(setKey, flow.id);
      }
    }
  }

  async updateRetailerIndexes(retailer, action) {
    if (action === 'save') {
      if (retailer.isActive) {
        const activeKey = Retailer.getActiveRetailersKey();
        await this.redisClient.sadd(activeKey, retailer.id);
      }

      const allKey = Retailer.getAllRetailersKey();
      await this.redisClient.sadd(allKey, retailer.id);
    } else if (action === 'delete') {
      const activeKey = Retailer.getActiveRetailersKey();
      const allKey = Retailer.getAllRetailersKey();
      await this.redisClient.srem(activeKey, retailer.id);
      await this.redisClient.srem(allKey, retailer.id);
    }
  }

  async updateLogIndexes(log, action) {
    if (action === 'save') {
      // Add to recent logs (limited list)
      const recentKey = Log.getRecentLogsKey();
      await this.redisClient.lpush(recentKey, log.id);
      await this.redisClient.ltrim(recentKey, 0, 999); // Keep last 1000 logs

      // Add to category logs
      const categoryKey = Log.getCategoryLogsKey(log.category);
      await this.redisClient.lpush(categoryKey, log.id);

      // Add to level logs
      const levelKey = Log.getLevelLogsKey(log.level);
      await this.redisClient.lpush(levelKey, log.id);

      // Add to error logs if it's an error
      if (log.isError()) {
        const errorKey = Log.getErrorLogsKey();
        await this.redisClient.lpush(errorKey, log.id);
      }
    }
  }

  // Utility methods
  getEntityKey(entity) {
    const entityType = entity.constructor.name;
    return this.getKeyForType(entityType, entity.id);
  }

  getKeyForType(entityType, id) {
    switch (entityType) {
      case 'Product':
        return Product.getRedisKey(id);
      case 'Retailer':
        return Retailer.getRedisKey(id);
      case 'Flow':
        return Flow.getRedisKey(id);
      case 'UserProfile':
        return UserProfile.getRedisKey(id);
      case 'Log':
        return Log.getRedisKey(id);
      default:
        return `${entityType.toLowerCase()}:${id}`;
    }
  }

  createEntityFromData(entityType, data) {
    switch (entityType) {
      case 'Product':
        return Product.fromJSON(data);
      case 'Retailer':
        return Retailer.fromJSON(data);
      case 'Flow':
        return Flow.fromJSON(data);
      case 'UserProfile':
        return UserProfile.fromJSON(data);
      case 'Log':
        return Log.fromJSON(data);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  // Health and statistics
  async getStats() {
    return {
      cacheSize: this.cache.size,
      pendingWrites: this.pendingWrites.size,
      cacheEnabled: this.options.cacheEnabled,
      redis: this.redisClient ? this.redisClient.getStatus() : null
    };
  }

  // Cleanup
  async cleanup() {
    // Flush any pending writes
    if (this.pendingWrites.size > 0) {
      await this.flushPendingWrites();
    }

    // Clear cache
    this.invalidateCache();

    logger.info('Database repository cleanup completed');
  }
}

// Singleton instance
let repositoryInstance = null;

export const getRepository = async (options = {}) => {
  if (!repositoryInstance) {
    repositoryInstance = new DatabaseRepository(options);
    await repositoryInstance.initialize();
  }
  return repositoryInstance;
};

export default DatabaseRepository;