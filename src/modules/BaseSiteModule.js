const { EventEmitter } = require('events');
const winston = require('winston');

/**
 * BaseSiteModule - Abstract base class for all site-specific modules
 * Provides common functionality and interfaces that all site modules must implement
 */
class BaseSiteModule extends EventEmitter {
  /**
   * Constructor for BaseSiteModule
   * @param {Object} config - Configuration object for the module
   * @param {Object} logger - Logger instance
   */
  constructor(config = {}, logger = null) {
    super();
    
    // Set up logger
    this.logger = logger || winston.createLogger({
      transports: [new winston.transports.Console({ silent: true })]
    });
    
    // Configuration
    this.config = {
      stealthLevel: 'high',
      maxRetries: 3,
      timeout: 30000,
      headless: true,
      ...config
    };
    
    // State management
    this.initialized = false;
    this.siteName = 'base';
    this.version = '1.0.0';
    
    // Browser context (to be set by implementing modules)
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize the site module
   * This method should be overridden by site-specific modules
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      this.logger.warn('Module already initialized');
      return;
    }
    
    this.logger.info('Initializing base site module', { site: this.siteName });
    
    // Emit initialization event
    this.emit('initializing', { site: this.siteName });
    
    // Mark as initialized
    this.initialized = true;
    
    // Emit initialized event
    this.emit('initialized', { site: this.siteName });
    
    this.logger.info('Base site module initialized', { site: this.siteName });
  }

  /**
   * Execute the checkout flow
   * This method should be overridden by site-specific modules
   * @param {Page} page - Playwright page instance
   * @param {Object} flowConfig - Flow configuration
   * @returns {Promise<Object>} - Execution result
   */
  async executeCheckout(page, flowConfig) {
    this.logger.info('Executing base checkout flow', { site: this.siteName });
    
    // Emit execution start event
    this.emit('checkoutStart', { site: this.siteName, flowConfig });
    
    // This is a placeholder implementation
    // Site-specific modules should implement their own checkout logic
    const result = {
      success: false,
      error: 'Base module does not implement checkout execution',
      timestamp: new Date().toISOString()
    };
    
    // Emit execution end event
    this.emit('checkoutEnd', { site: this.siteName, result });
    
    return result;
  }

  /**
   * Record a checkout flow
   * This method should be overridden by site-specific modules
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recording result
   */
  async recordFlow(page) {
    this.logger.info('Recording base checkout flow', { site: this.siteName });
    
    // Emit recording start event
    this.emit('recordStart', { site: this.siteName });
    
    // This is a placeholder implementation
    // Site-specific modules should implement their own recording logic
    const result = {
      success: false,
      error: 'Base module does not implement flow recording',
      timestamp: new Date().toISOString()
    };
    
    // Emit recording end event
    this.emit('recordEnd', { site: this.siteName, result });
    
    return result;
  }

  /**
   * Handle CAPTCHA challenges
   * This method should be overridden by site-specific modules
   * @param {Page} page - Playwright page instance
   * @returns {Promise<boolean>} - Whether CAPTCHA was successfully handled
   */
  async handleCaptcha(page) {
    this.logger.info('Handling CAPTCHA (base implementation)', { site: this.siteName });
    
    // Emit CAPTCHA detection event
    this.emit('captchaDetected', { site: this.siteName });
    
    // This is a placeholder implementation
    // Site-specific modules should implement their own CAPTCHA handling
    const handled = false;
    
    // Emit CAPTCHA handled event
    this.emit('captchaHandled', { site: this.siteName, handled });
    
    return handled;
  }

  /**
   * Handle errors and recovery
   * This method should be overridden by site-specific modules
   * @param {Error} error - Error to handle
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Error handling result
   */
  async handleError(error, page) {
    this.logger.warn('Handling error (base implementation)', { 
      site: this.siteName, 
      error: error.message 
    });
    
    // Emit error event
    this.emit('error', { site: this.siteName, error: error.message });
    
    // This is a placeholder implementation
    // Site-specific modules should implement their own error handling
    const result = {
      recovered: false,
      strategy: 'none',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    // Emit error handled event
    this.emit('errorHandled', { site: this.siteName, result });
    
    return result;
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   * @returns {boolean} - Whether configuration is valid
   */
  validateConfig(config) {
    this.logger.debug('Validating configuration', { site: this.siteName });
    
    // Basic validation - site-specific modules should implement more detailed validation
    if (!config || typeof config !== 'object') {
      this.logger.error('Invalid configuration: must be an object', { site: this.siteName });
      return false;
    }
    
    this.logger.debug('Configuration validation passed', { site: this.siteName });
    return true;
  }

  /**
   * Merge configuration with defaults
   * @param {Object} config - Configuration to merge
   * @returns {Object} - Merged configuration
   */
  mergeConfig(config) {
    this.logger.debug('Merging configuration with defaults', { site: this.siteName });
    
    return {
      ...this.config,
      ...config
    };
  }

  /**
   * Set browser context
   * @param {Browser} browser - Browser instance
   * @param {BrowserContext} context - Browser context
   * @param {Page} page - Page instance
   */
  setBrowserContext(browser, context, page) {
    this.browser = browser;
    this.context = context;
    this.page = page;
    
    this.logger.debug('Browser context set', { site: this.siteName });
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.logger.info('Cleaning up resources', { site: this.siteName });
    
    // Emit cleanup start event
    this.emit('cleanupStart', { site: this.siteName });
    
    // Reset state
    this.initialized = false;
    this.browser = null;
    this.context = null;
    this.page = null;
    
    // Emit cleanup end event
    this.emit('cleanupEnd', { site: this.siteName });
    
    this.logger.info('Resources cleaned up', { site: this.siteName });
  }

  /**
   * Get module information
   * @returns {Object} - Module information
   */
  getInfo() {
    return {
      siteName: this.siteName,
      version: this.version,
      initialized: this.initialized,
      config: this.config
    };
  }
}

module.exports = BaseSiteModule;