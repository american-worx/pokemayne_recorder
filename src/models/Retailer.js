import { v4 as uuidv4 } from 'uuid';

export class Retailer {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.url = data.url || '';
    this.internalId = data.internalId || null;
    this.zipcode = data.zipcode || null;
    this.products = data.products || [];

    // Additional fields
    this.domain = data.domain || '';
    this.country = data.country || 'US';
    this.currency = data.currency || 'USD';
    this.timezone = data.timezone || 'America/New_York';
    this.logo = data.logo || null;
    this.description = data.description || '';

    // Contact information
    this.contact = data.contact || {
      email: null,
      phone: null,
      address: {
        street: null,
        city: null,
        state: null,
        zipcode: this.zipcode,
        country: this.country
      }
    };

    // API configuration
    this.apiConfig = data.apiConfig || {
      baseUrl: null,
      apiKey: null,
      rateLimit: {
        requests: 100,
        window: 3600 // per hour
      },
      endpoints: {
        products: null,
        search: null,
        inventory: null,
        pricing: null
      }
    };

    // Automation settings
    this.automationConfig = data.automationConfig || {
      selectors: {
        addToCart: null,
        quantity: null,
        price: null,
        availability: null,
        productTitle: null,
        productImage: null,
        checkout: null,
        login: null
      },
      delays: {
        pageLoad: 5000,
        actionDelay: 2000,
        retryDelay: 3000
      },
      userAgent: null,
      viewport: null,
      proxy: null
    };

    // Monitoring settings
    this.monitoringConfig = data.monitoringConfig || {
      enabled: true,
      interval: 300000, // 5 minutes
      checkStock: true,
      checkPrice: true,
      notifications: {
        discord: false,
        email: false,
        webhook: null
      }
    };

    // Statistics
    this.stats = data.stats || {
      totalProducts: 0,
      activeProducts: 0,
      lastSyncAt: null,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };

    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastActive = data.lastActive || null;
    this.isActive = data.isActive ?? true;
    this.status = data.status || 'active'; // active, inactive, maintenance, error
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Retailer name is required');
    }

    if (!this.url) {
      errors.push('Retailer URL is required');
    }

    try {
      const url = new globalThis.URL(this.url);
      this.domain = url.hostname;
    } catch {
      errors.push('Invalid URL format');
    }

    if (this.zipcode && !/^\d{5}(-\d{4})?$/.test(this.zipcode)) {
      errors.push('Invalid zipcode format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Product management
  addProduct(productId) {
    if (!this.products.includes(productId)) {
      this.products.push(productId);
      this.stats.totalProducts = this.products.length;
      this.updatedAt = new Date().toISOString();
    }
    return this;
  }

  removeProduct(productId) {
    this.products = this.products.filter(id => id !== productId);
    this.stats.totalProducts = this.products.length;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Statistics updates
  updateStats(updates) {
    this.stats = { ...this.stats, ...updates };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  incrementSuccessfulRequests() {
    this.stats.successfulRequests++;
    this.lastActive = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  incrementFailedRequests() {
    this.stats.failedRequests++;
    this.lastActive = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateResponseTime(responseTime) {
    // Calculate rolling average
    const total = this.stats.successfulRequests + this.stats.failedRequests;
    this.stats.averageResponseTime = total === 1
      ? responseTime
      : (this.stats.averageResponseTime * (total - 1) + responseTime) / total;

    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Configuration updates
  updateApiConfig(config) {
    this.apiConfig = { ...this.apiConfig, ...config };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateAutomationConfig(config) {
    this.automationConfig = { ...this.automationConfig, ...config };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateMonitoringConfig(config) {
    this.monitoringConfig = { ...this.monitoringConfig, ...config };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Status management
  setStatus(status) {
    this.status = status;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  activate() {
    this.isActive = true;
    this.status = 'active';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  deactivate() {
    this.isActive = false;
    this.status = 'inactive';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      internalId: this.internalId,
      zipcode: this.zipcode,
      products: this.products,
      domain: this.domain,
      country: this.country,
      currency: this.currency,
      timezone: this.timezone,
      logo: this.logo,
      description: this.description,
      contact: this.contact,
      apiConfig: this.apiConfig,
      automationConfig: this.automationConfig,
      monitoringConfig: this.monitoringConfig,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActive: this.lastActive,
      isActive: this.isActive,
      status: this.status
    };
  }

  static fromJSON(data) {
    return new Retailer(data);
  }

  // Query helpers
  static getRedisKey(id) {
    return `retailer:${id}`;
  }

  static getAllRetailersKey() {
    return 'retailers:all';
  }

  static getActiveRetailersKey() {
    return 'retailers:active';
  }

  static getDomainKey(domain) {
    return `retailer:domain:${domain}`;
  }
}

export default Retailer;