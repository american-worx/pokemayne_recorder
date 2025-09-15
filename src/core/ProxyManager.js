const winston = require('winston');

/**
 * Proxy - Represents a proxy server with health and performance metrics
 */
class Proxy {
  constructor(config) {
    this.server = config.server;
    this.username = config.username;
    this.password = config.password;
    this.protocol = config.protocol || 'http';
    this.port = config.port || 80;
    this.id = config.id || this.generateId();
    
    // Health and performance metrics
    this.isActive = true;
    this.successCount = 0;
    this.failureCount = 0;
    this.totalRequests = 0;
    this.avgResponseTime = 0;
    this.lastUsed = null;
    this.lastHealthCheck = null;
    this.healthScore = 1.0; // 0.0 - 1.0, where 1.0 is healthy
    
    // Performance tracking
    this.responseTimes = [];
    this.maxResponseTimes = 50; // Keep track of last 50 response times
  }
  
  /**
   * Generate a unique ID for the proxy
   * @returns {string} - Unique ID
   */
  generateId() {
    return `${this.protocol || 'http'}://${this.server}:${this.port || 80}`;
  }
  
  /**
   * Mark a successful request
   * @param {number} responseTime - Response time in milliseconds
   */
  markSuccess(responseTime) {
    this.successCount++;
    this.totalRequests++;
    this.lastUsed = Date.now();
    
    // Update average response time
    this.updateResponseTime(responseTime);
    
    // Recalculate health score
    this.calculateHealthScore();
  }
  
  /**
   * Mark a failed request
   */
  markFailure() {
    this.failureCount++;
    this.totalRequests++;
    this.lastUsed = Date.now();
    
    // Recalculate health score
    this.calculateHealthScore();
  }
  
  /**
   * Update response time tracking
   * @param {number} responseTime - Response time in milliseconds
   */
  updateResponseTime(responseTime) {
    this.responseTimes.push(responseTime);
    
    // Keep only the last N response times
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
    
    // Calculate average response time
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.avgResponseTime = sum / this.responseTimes.length;
  }
  
  /**
   * Calculate health score based on success rate and response time
   */
  calculateHealthScore() {
    if (this.totalRequests === 0) {
      this.healthScore = 1.0;
      return;
    }
    
    // Success rate component (70% weight)
    const successRate = this.totalRequests > 0 ? this.successCount / this.totalRequests : 1.0;
    const successRateScore = successRate;
    
    // Response time component (30% weight)
    // Normalize response time (assuming 5000ms is the worst acceptable time)
    const maxAcceptableTime = 5000;
    const responseTimeScore = this.avgResponseTime > 0 ? Math.max(0, 1 - (this.avgResponseTime / maxAcceptableTime)) : 1.0;
    
    // Weighted average
    this.healthScore = (successRateScore * 0.7) + (responseTimeScore * 0.3);
    
    // Ensure health score is between 0 and 1
    this.healthScore = Math.max(0, Math.min(1, this.healthScore));
  }
  
  /**
   * Get proxy configuration for Playwright
   * @returns {Object} - Proxy configuration
   */
  getPlaywrightConfig() {
    const config = {
      server: `${this.protocol}://${this.server}:${this.port}`
    };
    
    if (this.username && this.password) {
      config.username = this.username;
      config.password = this.password;
    }
    
    return config;
  }
  
  /**
   * Check if proxy is healthy
   * @returns {boolean} - Whether proxy is healthy
   */
  isHealthy() {
    return this.isActive && this.healthScore > 0.3;
  }
  
  /**
   * Disable proxy
   */
  disable() {
    this.isActive = false;
  }
  
  /**
   * Enable proxy
   */
  enable() {
    this.isActive = true;
  }
  
  /**
   * Get proxy statistics
   * @returns {Object} - Proxy statistics
   */
  getStats() {
    return {
      id: this.id,
      server: this.server,
      protocol: this.protocol,
      port: this.port,
      isActive: this.isActive,
      successCount: this.successCount,
      failureCount: this.failureCount,
      totalRequests: this.totalRequests,
      successRate: this.totalRequests > 0 ? this.successCount / this.totalRequests : 0,
      avgResponseTime: this.avgResponseTime,
      healthScore: this.healthScore,
      lastUsed: this.lastUsed,
      lastHealthCheck: this.lastHealthCheck
    };
  }
}

/**
 * ProxyManager - Manages a pool of proxies with health checking and rotation
 */
class ProxyManager {
  constructor(logger) {
    this.logger = logger || winston.createLogger({ transports: [new winston.transports.Console({ silent: true })] });
    this.proxies = new Map();
    this.proxyList = []; // Array for ordered access
    this.currentProxyIndex = 0;
    this.healthCheckInterval = 300000; // 5 minutes
    this.healthCheckTimer = null;
  }
  
  /**
   * Add a proxy to the pool
   * @param {Object} proxyConfig - Proxy configuration
   * @returns {Proxy} - Added proxy
   */
  addProxy(proxyConfig) {
    const proxy = new Proxy(proxyConfig);
    this.proxies.set(proxy.id, proxy);
    this.proxyList.push(proxy);
    this.logger.info('Proxy added to pool', { proxyId: proxy.id });
    return proxy;
  }
  
  /**
   * Remove a proxy from the pool
   * @param {string} proxyId - Proxy ID
   * @returns {boolean} - Whether proxy was removed
   */
  removeProxy(proxyId) {
    const proxy = this.proxies.get(proxyId);
    if (proxy) {
      this.proxies.delete(proxyId);
      this.proxyList = this.proxyList.filter(p => p.id !== proxyId);
      this.logger.info('Proxy removed from pool', { proxyId });
      return true;
    }
    return false;
  }
  
  /**
   * Get a proxy by ID
   * @param {string} proxyId - Proxy ID
   * @returns {Proxy|null} - Proxy or null if not found
   */
  getProxy(proxyId) {
    return this.proxies.get(proxyId) || null;
  }
  
  /**
   * Get next proxy using round-robin strategy
   * @returns {Proxy|null} - Next healthy proxy or null if none available
   */
  getNextProxy() {
    if (this.proxyList.length === 0) {
      return null;
    }
    
    // Try to find a healthy proxy
    for (let i = 0; i < this.proxyList.length; i++) {
      const proxy = this.proxyList[this.currentProxyIndex];
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
      
      if (proxy.isHealthy()) {
        this.logger.debug('Selected proxy for rotation', { proxyId: proxy.id, healthScore: proxy.healthScore });
        return proxy;
      }
    }
    
    // If no healthy proxy found, return the best available one
    const bestProxy = this.getBestProxy();
    if (bestProxy) {
      this.logger.warn('No healthy proxies available, using best available', { proxyId: bestProxy.id, healthScore: bestProxy.healthScore });
      return bestProxy;
    }
    
    this.logger.error('No proxies available');
    return null;
  }
  
  /**
   * Get the best proxy based on health score
   * @returns {Proxy|null} - Best proxy or null if none available
   */
  getBestProxy() {
    if (this.proxyList.length === 0) {
      return null;
    }
    
    // Filter active proxies
    const activeProxies = this.proxyList.filter(proxy => proxy.isActive);
    if (activeProxies.length === 0) {
      return null;
    }
    
    // Sort by health score (descending)
    activeProxies.sort((a, b) => b.healthScore - a.healthScore);
    return activeProxies[0];
  }
  
  /**
   * Get all proxies
   * @returns {Array<Proxy>} - Array of all proxies
   */
  getAllProxies() {
    return Array.from(this.proxies.values());
  }
  
  /**
   * Get healthy proxies
   * @returns {Array<Proxy>} - Array of healthy proxies
   */
  getHealthyProxies() {
    return this.proxyList.filter(proxy => proxy.isHealthy());
  }
  
  /**
   * Mark a proxy as successful
   * @param {string} proxyId - Proxy ID
   * @param {number} responseTime - Response time in milliseconds
   */
  markProxySuccess(proxyId, responseTime) {
    const proxy = this.proxies.get(proxyId);
    if (proxy) {
      proxy.markSuccess(responseTime);
      this.logger.debug('Proxy marked as successful', { proxyId, responseTime, healthScore: proxy.healthScore });
    }
  }
  
  /**
   * Mark a proxy as failed
   * @param {string} proxyId - Proxy ID
   */
  markProxyFailure(proxyId) {
    const proxy = this.proxies.get(proxyId);
    if (proxy) {
      proxy.markFailure();
      this.logger.debug('Proxy marked as failed', { proxyId, healthScore: proxy.healthScore });
      
      // If health score is too low, consider disabling
      if (proxy.healthScore < 0.2) {
        this.logger.warn('Proxy health critically low, consider disabling', { proxyId, healthScore: proxy.healthScore });
      }
    }
  }
  
  /**
   * Perform health check on all proxies
   */
  async performHealthCheck() {
    this.logger.info('Performing proxy health check', { proxyCount: this.proxyList.length });
    
    for (const proxy of this.proxyList) {
      try {
        proxy.lastHealthCheck = Date.now();
        // In a real implementation, this would perform an actual health check
        // For now, we'll just update the timestamp
        this.logger.debug('Health check performed for proxy', { proxyId: proxy.id });
      } catch (error) {
        this.logger.error('Health check failed for proxy', { proxyId: proxy.id, error: error.message });
      }
    }
  }
  
  /**
   * Start automatic health checking
   */
  startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
    
    this.logger.info('Proxy health checks started', { interval: this.healthCheckInterval });
  }
  
  /**
   * Stop automatic health checking
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      this.logger.info('Proxy health checks stopped');
    }
  }
  
  /**
   * Load proxies from configuration
   * @param {Array<Object>} proxyConfigs - Array of proxy configurations
   */
  loadProxies(proxyConfigs) {
    this.logger.info('Loading proxies from configuration', { proxyCount: proxyConfigs.length });
    
    for (const config of proxyConfigs) {
      try {
        this.addProxy(config);
      } catch (error) {
        this.logger.error('Failed to add proxy from configuration', { error: error.message, config });
      }
    }
  }
  
  /**
   * Get proxy pool statistics
   * @returns {Object} - Proxy pool statistics
   */
  getStats() {
    const totalProxies = this.proxyList.length;
    const activeProxies = this.proxyList.filter(proxy => proxy.isActive).length;
    const healthyProxies = this.proxyList.filter(proxy => proxy.isHealthy()).length;
    
    const totalRequests = this.proxyList.reduce((sum, proxy) => sum + proxy.totalRequests, 0);
    const totalSuccess = this.proxyList.reduce((sum, proxy) => sum + proxy.successCount, 0);
    const overallSuccessRate = totalRequests > 0 ? totalSuccess / totalRequests : 0;
    
    return {
      totalProxies,
      activeProxies,
      healthyProxies,
      totalRequests,
      totalSuccess,
      overallSuccessRate,
      proxies: this.proxyList.map(proxy => proxy.getStats())
    };
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.stopHealthChecks();
    this.proxies.clear();
    this.proxyList = [];
    this.logger.info('ProxyManager destroyed');
  }
}

module.exports = { ProxyManager, Proxy };