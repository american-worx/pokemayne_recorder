import { v4 as uuidv4 } from 'uuid';

export class Log {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.level = data.level || 'info'; // debug, info, warn, error, fatal
    this.message = data.message || '';
    this.category = data.category || 'general';
    this.service = data.service || 'pokemayne-recorder';

    // Context and metadata
    this.context = data.context || {};
    this.userId = data.userId || null;
    this.sessionId = data.sessionId || null;
    this.requestId = data.requestId || null;
    this.retailerId = data.retailerId || null;
    this.productId = data.productId || null;
    this.flowId = data.flowId || null;

    // Error information
    this.error = data.error || null; // Error object or stack trace
    this.errorCode = data.errorCode || null;
    this.errorType = data.errorType || null;

    // Performance metrics
    this.duration = data.duration || null; // Operation duration in ms
    this.memoryUsage = data.memoryUsage || null;
    this.cpuUsage = data.cpuUsage || null;

    // Request/Response information
    this.request = data.request || null;
    this.response = data.response || null;
    this.httpMethod = data.httpMethod || null;
    this.httpStatus = data.httpStatus || null;
    this.userAgent = data.userAgent || null;
    this.ipAddress = data.ipAddress || null;

    // Browser/Automation specific
    this.browserInfo = data.browserInfo || null;
    this.pageUrl = data.pageUrl || null;
    this.elementSelector = data.elementSelector || null;
    this.automationStep = data.automationStep || null;

    // Business logic specific
    this.action = data.action || null; // purchase, login, search, monitor
    this.outcome = data.outcome || null; // success, failure, timeout, cancelled
    this.retailerResponse = data.retailerResponse || null;

    // Timestamps
    this.timestamp = data.timestamp || new Date().toISOString();
    this.createdAt = data.createdAt || this.timestamp;

    // Additional metadata
    this.tags = data.tags || [];
    this.source = data.source || 'application'; // application, automation, monitoring, api
    this.environment = data.environment || process.env.NODE_ENV || 'development';
    this.version = data.version || '1.0.0';
  }

  // Static factory methods for different log types
  static createInfo(message, context = {}) {
    return new Log({
      level: 'info',
      message,
      context,
      category: 'general'
    });
  }

  static createError(message, error = null, context = {}) {
    return new Log({
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      context,
      category: 'error'
    });
  }

  static createDebug(message, context = {}) {
    return new Log({
      level: 'debug',
      message,
      context,
      category: 'debug'
    });
  }

  static createWarn(message, context = {}) {
    return new Log({
      level: 'warn',
      message,
      context,
      category: 'warning'
    });
  }

  // Automation specific logs
  static createAutomationLog(action, outcome, context = {}) {
    return new Log({
      level: outcome === 'success' ? 'info' : 'error',
      message: `Automation ${action}: ${outcome}`,
      category: 'automation',
      action,
      outcome,
      context,
      source: 'automation'
    });
  }

  static createMonitoringLog(message, context = {}) {
    return new Log({
      level: 'info',
      message,
      category: 'monitoring',
      context,
      source: 'monitoring'
    });
  }

  static createPerformanceLog(operation, duration, context = {}) {
    return new Log({
      level: 'info',
      message: `${operation} completed in ${duration}ms`,
      category: 'performance',
      duration,
      context,
      action: operation
    });
  }

  static createSecurityLog(event, context = {}) {
    return new Log({
      level: 'warn',
      message: `Security event: ${event}`,
      category: 'security',
      context,
      tags: ['security']
    });
  }

  static createAPILog(method, endpoint, status, duration, context = {}) {
    return new Log({
      level: status >= 400 ? 'error' : 'info',
      message: `${method} ${endpoint} - ${status}`,
      category: 'api',
      httpMethod: method,
      httpStatus: status,
      duration,
      context,
      source: 'api'
    });
  }

  // Business logic logs
  static createPurchaseLog(outcome, amount, retailer, context = {}) {
    return new Log({
      level: outcome === 'success' ? 'info' : 'error',
      message: `Purchase ${outcome}: $${amount} at ${retailer}`,
      category: 'purchase',
      action: 'purchase',
      outcome,
      context: { ...context, amount, retailer },
      tags: ['business', 'purchase']
    });
  }

  static createInventoryLog(product, status, context = {}) {
    return new Log({
      level: 'info',
      message: `Inventory check: ${product} - ${status}`,
      category: 'inventory',
      action: 'inventory_check',
      outcome: status,
      context: { ...context, product },
      source: 'monitoring'
    });
  }

  // Utility methods
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    return this;
  }

  addTags(tags) {
    tags.forEach(tag => this.addTag(tag));
    return this;
  }

  updateContext(newContext) {
    this.context = { ...this.context, ...newContext };
    return this;
  }

  setUser(userId) {
    this.userId = userId;
    return this;
  }

  setSession(sessionId) {
    this.sessionId = sessionId;
    return this;
  }

  setRequest(requestId) {
    this.requestId = requestId;
    return this;
  }

  setRetailer(retailerId) {
    this.retailerId = retailerId;
    return this;
  }

  setProduct(productId) {
    this.productId = productId;
    return this;
  }

  setFlow(flowId) {
    this.flowId = flowId;
    return this;
  }

  // Filtering helpers
  isError() {
    return this.level === 'error' || this.level === 'fatal';
  }

  isWarning() {
    return this.level === 'warn';
  }

  isInfo() {
    return this.level === 'info';
  }

  isDebug() {
    return this.level === 'debug';
  }

  hasTag(tag) {
    return this.tags.includes(tag);
  }

  isCategory(category) {
    return this.category === category;
  }

  isSource(source) {
    return this.source === source;
  }

  // Time helpers
  getAge() {
    return Date.now() - new Date(this.timestamp).getTime();
  }

  isRecent(milliseconds = 300000) { // 5 minutes default
    return this.getAge() < milliseconds;
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      level: this.level,
      message: this.message,
      category: this.category,
      service: this.service,
      context: this.context,
      userId: this.userId,
      sessionId: this.sessionId,
      requestId: this.requestId,
      retailerId: this.retailerId,
      productId: this.productId,
      flowId: this.flowId,
      error: this.error,
      errorCode: this.errorCode,
      errorType: this.errorType,
      duration: this.duration,
      memoryUsage: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      request: this.request,
      response: this.response,
      httpMethod: this.httpMethod,
      httpStatus: this.httpStatus,
      userAgent: this.userAgent,
      ipAddress: this.ipAddress,
      browserInfo: this.browserInfo,
      pageUrl: this.pageUrl,
      elementSelector: this.elementSelector,
      automationStep: this.automationStep,
      action: this.action,
      outcome: this.outcome,
      retailerResponse: this.retailerResponse,
      timestamp: this.timestamp,
      createdAt: this.createdAt,
      tags: this.tags,
      source: this.source,
      environment: this.environment,
      version: this.version
    };
  }

  static fromJSON(data) {
    return new Log(data);
  }

  // Query helpers
  static getRedisKey(id) {
    return `log:${id}`;
  }

  static getLevelLogsKey(level) {
    return `logs:level:${level}`;
  }

  static getCategoryLogsKey(category) {
    return `logs:category:${category}`;
  }

  static getSourceLogsKey(source) {
    return `logs:source:${source}`;
  }

  static getUserLogsKey(userId) {
    return `logs:user:${userId}`;
  }

  static getSessionLogsKey(sessionId) {
    return `logs:session:${sessionId}`;
  }

  static getRetailerLogsKey(retailerId) {
    return `logs:retailer:${retailerId}`;
  }

  static getDateLogsKey(date) {
    return `logs:date:${date}`;
  }

  static getRecentLogsKey() {
    return 'logs:recent';
  }

  static getErrorLogsKey() {
    return 'logs:errors';
  }
}

export default Log;