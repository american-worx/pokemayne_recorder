import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import logger from '../core/utils/logger.js';
import { getRandomUserAgent } from '../core/utils/user-agents.js';

class ProxyService {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      rotation: options.rotation ?? true,
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000,
      userAgentRotation: options.userAgentRotation ?? true,
      rateLimit: options.rateLimit || {
        requests: 60,
        window: 60000 // 1 minute
      },
      ...options
    };

    // Proxy configurations
    this.proxies = [];
    this.currentProxyIndex = 0;
    this.proxyStats = new Map();
    this.rateLimitTracker = new Map();

    // Default proxy configurations
    this.defaultProxies = [
      // Add your proxy configurations here
      // { type: 'http', host: 'proxy1.example.com', port: 8080, auth: { username: 'user', password: 'pass' } },
      // { type: 'socks5', host: 'proxy2.example.com', port: 1080, auth: { username: 'user', password: 'pass' } }
    ];

    this.loadProxies();
  }

  loadProxies() {
    // Load proxies from environment or configuration
    const proxyList = process.env.PROXY_LIST || '';

    if (proxyList) {
      try {
        const proxies = proxyList.split(',').map(proxy => {
          const [host, port, username, password] = proxy.split(':');
          return {
            type: 'http',
            host: host.trim(),
            port: parseInt(port.trim()),
            auth: username && password ? { username: username.trim(), password: password.trim() } : null
          };
        });

        this.proxies = proxies;
      } catch (error) {
        logger.error('Failed to parse proxy list from environment:', error);
        this.proxies = this.defaultProxies;
      }
    } else {
      this.proxies = this.defaultProxies;
    }

    // Initialize proxy stats
    this.proxies.forEach((proxy, index) => {
      this.proxyStats.set(index, {
        requests: 0,
        successes: 0,
        failures: 0,
        avgResponseTime: 0,
        lastUsed: null,
        isHealthy: true
      });
    });

    logger.info(`Proxy service initialized with ${this.proxies.length} proxies`, {
      enabled: this.options.enabled,
      rotation: this.options.rotation
    });
  }

  // Get next proxy in rotation
  getNextProxy() {
    if (!this.options.enabled || this.proxies.length === 0) {
      return null;
    }

    if (!this.options.rotation) {
      return this.proxies[0];
    }

    // Find next healthy proxy
    let attempts = 0;
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentProxyIndex];
      const stats = this.proxyStats.get(this.currentProxyIndex);

      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
      attempts++;

      if (stats.isHealthy) {
        return { ...proxy, index: this.currentProxyIndex - 1 };
      }
    }

    // If no healthy proxies, return first one anyway
    logger.warn('No healthy proxies available, using first proxy');
    return { ...this.proxies[0], index: 0 };
  }

  // Create axios agent with proxy
  createProxyAgent(proxy) {
    if (!proxy) {
      return null;
    }

    try {
      const proxyUrl = proxy.auth
        ? `${proxy.type}://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`
        : `${proxy.type}://${proxy.host}:${proxy.port}`;

      if (proxy.type === 'socks5' || proxy.type === 'socks4') {
        return new SocksProxyAgent(proxyUrl);
      } else {
        return new HttpsProxyAgent(proxyUrl);
      }
    } catch (error) {
      logger.error('Failed to create proxy agent:', error);
      return null;
    }
  }

  // Check rate limits
  checkRateLimit(url) {
    if (!this.options.rateLimit) {
      return true;
    }

    const domain = new globalThis.URL(url).hostname;
    const now = Date.now();

    if (!this.rateLimitTracker.has(domain)) {
      this.rateLimitTracker.set(domain, { requests: [], window: now });
      return true;
    }

    const tracker = this.rateLimitTracker.get(domain);

    // Clean old requests outside the window
    tracker.requests = tracker.requests.filter(
      timestamp => now - timestamp < this.options.rateLimit.window
    );

    // Check if we're under the limit
    if (tracker.requests.length >= this.options.rateLimit.requests) {
      return false;
    }

    // Add current request
    tracker.requests.push(now);
    return true;
  }

  // Update proxy statistics
  updateProxyStats(proxyIndex, success, responseTime) {
    const stats = this.proxyStats.get(proxyIndex);
    if (!stats) return;

    stats.requests++;
    stats.lastUsed = new Date().toISOString();

    if (success) {
      stats.successes++;
      // Update average response time
      stats.avgResponseTime = stats.avgResponseTime === 0
        ? responseTime
        : (stats.avgResponseTime + responseTime) / 2;
    } else {
      stats.failures++;
    }

    // Update health status based on success rate
    const successRate = stats.successes / stats.requests;
    stats.isHealthy = successRate >= 0.7; // 70% success rate threshold

    this.proxyStats.set(proxyIndex, stats);
  }

  // Main request method
  async makeRequest(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      data = null,
      timeout = this.options.timeout,
      retailer = null,
      skipRateLimit = false,
      retries = this.options.retries
    } = options;

    // Check rate limits
    if (!skipRateLimit && !this.checkRateLimit(url)) {
      throw new Error(`Rate limit exceeded for ${new globalThis.URL(url).hostname}`);
    }

    let lastError = null;
    let attempt = 0;

    while (attempt <= retries) {
      const proxy = this.getNextProxy();
      const agent = this.createProxyAgent(proxy);
      const startTime = Date.now();

      try {
        // Prepare request configuration
        const config = {
          method,
          url,
          headers: {
            'User-Agent': this.options.userAgentRotation ? getRandomUserAgent() : headers['User-Agent'],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            ...headers
          },
          timeout,
          httpsAgent: agent,
          httpAgent: agent,
          maxRedirects: 5,
          validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        };

        if (data) {
          config.data = data;
        }

        // Add retailer-specific headers if provided
        if (retailer) {
          config.headers = {
            ...config.headers,
            ...this.getRetailerHeaders(retailer)
          };
        }

        // Make the request
        logger.debug('Making proxied request', {
          url,
          method,
          proxy: proxy ? `${proxy.host}:${proxy.port}` : 'direct',
          attempt: attempt + 1
        });

        const response = await axios(config);
        const responseTime = Date.now() - startTime;

        // Update proxy stats
        if (proxy && proxy.index !== undefined) {
          this.updateProxyStats(proxy.index, true, responseTime);
        }

        logger.debug('Proxied request successful', {
          url,
          status: response.status,
          responseTime,
          proxy: proxy ? `${proxy.host}:${proxy.port}` : 'direct'
        });

        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          config: response.config,
          request: {
            url,
            method,
            headers: config.headers,
            proxy: proxy ? { host: proxy.host, port: proxy.port } : null,
            responseTime
          }
        };

      } catch (error) {
        const responseTime = Date.now() - startTime;
        lastError = error;

        // Update proxy stats
        if (proxy && proxy.index !== undefined) {
          this.updateProxyStats(proxy.index, false, responseTime);
        }

        logger.warn('Proxied request failed', {
          url,
          method,
          proxy: proxy ? `${proxy.host}:${proxy.port}` : 'direct',
          attempt: attempt + 1,
          error: error.message,
          responseTime
        });

        attempt++;

        if (attempt <= retries) {
          // Wait before retry
          const delay = this.options.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    logger.error('All proxied request attempts failed', {
      url,
      method,
      attempts: attempt,
      error: lastError.message
    });

    throw lastError;
  }

  // Retailer-specific headers
  getRetailerHeaders(retailer) {
    const baseHeaders = {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    switch (retailer.toLowerCase()) {
      case 'walmart':
        return {
          ...baseHeaders,
          'Referer': 'https://www.walmart.com/',
          'Origin': 'https://www.walmart.com'
        };
      case 'target':
        return {
          ...baseHeaders,
          'Referer': 'https://www.target.com/',
          'Origin': 'https://www.target.com'
        };
      case 'amazon':
        return {
          ...baseHeaders,
          'Referer': 'https://www.amazon.com/',
          'Origin': 'https://www.amazon.com'
        };
      default:
        return baseHeaders;
    }
  }

  // Convenience methods for different HTTP methods
  async get(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.makeRequest(url, { ...options, method: 'POST', data });
  }

  async put(url, data, options = {}) {
    return this.makeRequest(url, { ...options, method: 'PUT', data });
  }

  async delete(url, options = {}) {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }

  // Health check methods
  async checkProxyHealth(proxyIndex) {
    const proxy = this.proxies[proxyIndex];
    if (!proxy) return false;

    try {
      const response = await this.makeRequest('https://httpbin.org/ip', {
        timeout: 10000,
        retries: 0,
        skipRateLimit: true
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async healthCheckAll() {
    const results = [];

    for (let i = 0; i < this.proxies.length; i++) {
      const isHealthy = await this.checkProxyHealth(i);
      const stats = this.proxyStats.get(i);

      if (stats) {
        stats.isHealthy = isHealthy;
        this.proxyStats.set(i, stats);
      }

      results.push({
        index: i,
        proxy: this.proxies[i],
        healthy: isHealthy,
        stats: stats
      });
    }

    logger.info('Proxy health check completed', {
      total: this.proxies.length,
      healthy: results.filter(r => r.healthy).length
    });

    return results;
  }

  // Statistics and monitoring
  getProxyStats() {
    const stats = [];

    for (let i = 0; i < this.proxies.length; i++) {
      const proxy = this.proxies[i];
      const proxyStats = this.proxyStats.get(i);

      stats.push({
        index: i,
        proxy: {
          type: proxy.type,
          host: proxy.host,
          port: proxy.port,
          hasAuth: !!proxy.auth
        },
        stats: proxyStats
      });
    }

    return stats;
  }

  getRateLimitStats() {
    const stats = {};

    for (const [domain, tracker] of this.rateLimitTracker) {
      const now = Date.now();
      const recentRequests = tracker.requests.filter(
        timestamp => now - timestamp < this.options.rateLimit.window
      ).length;

      stats[domain] = {
        recentRequests,
        limit: this.options.rateLimit.requests,
        window: this.options.rateLimit.window,
        utilizationPercent: (recentRequests / this.options.rateLimit.requests) * 100
      };
    }

    return stats;
  }

  // Configuration management
  addProxy(proxy) {
    this.proxies.push(proxy);
    this.proxyStats.set(this.proxies.length - 1, {
      requests: 0,
      successes: 0,
      failures: 0,
      avgResponseTime: 0,
      lastUsed: null,
      isHealthy: true
    });

    logger.info('Proxy added', { proxy: `${proxy.host}:${proxy.port}` });
  }

  removeProxy(index) {
    if (index >= 0 && index < this.proxies.length) {
      const proxy = this.proxies[index];
      this.proxies.splice(index, 1);
      this.proxyStats.delete(index);

      // Reindex remaining proxies
      const newStats = new Map();
      this.proxies.forEach((_, newIndex) => {
        const oldIndex = newIndex >= index ? newIndex + 1 : newIndex;
        newStats.set(newIndex, this.proxyStats.get(oldIndex));
      });
      this.proxyStats = newStats;

      logger.info('Proxy removed', { proxy: `${proxy.host}:${proxy.port}` });
    }
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    logger.info('Proxy service options updated', newOptions);
  }
}

// Singleton instance
let proxyServiceInstance = null;

export const getProxyService = (options = {}) => {
  if (!proxyServiceInstance) {
    proxyServiceInstance = new ProxyService(options);
  }
  return proxyServiceInstance;
};

export default ProxyService;