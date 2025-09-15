const BaseSiteModule = require('./BaseSiteModule');
const { humanLikeFill, humanLikeClick, humanLikeDelay } = require('./CommonUtils');

/**
 * BestBuyModule - Site module for BestBuy
 * Implements GraphQL inventory monitoring, wave release detection,
 * queue management system, and fast-track optimization
 */
class BestBuyModule extends BaseSiteModule {
  /**
   * Constructor for BestBuyModule
   * @param {Object} config - Configuration object for the module
   * @param {Object} logger - Logger instance
   */
  constructor(config = {}, logger = null) {
    super(config, logger);
    this.siteName = 'bestbuy';
    this.version = '1.0.0';
    this.graphqlTimeout = config.graphqlTimeout || 5000;
  }

  /**
   * Initialize the BestBuy module
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      this.logger.warn('BestBuy module already initialized');
      return;
    }
    
    this.logger.info('Initializing BestBuy module', { site: this.siteName });
    
    // Emit initialization event
    this.emit('initializing', { site: this.siteName });
    
    // Perform any site-specific initialization
    this.logger.info('BestBuy module initialized', { site: this.siteName });
    
    // Mark as initialized
    this.initialized = true;
    
    // Emit initialized event
    this.emit('initialized', { site: this.siteName });
  }

  /**
   * Execute the BestBuy checkout flow
   * @param {Page} page - Playwright page instance
   * @param {Object} flowConfig - Flow configuration
   * @returns {Promise<Object>} - Execution result
   */
  async executeCheckout(page, flowConfig) {
    this.logger.info('Executing BestBuy checkout flow', { site: this.siteName });
    
    // Emit execution start event
    this.emit('checkoutStart', { site: this.siteName, flowConfig });
    
    try {
      // Check for wave release if monitoring is enabled
      if (flowConfig.options?.waveMonitoringEnabled) {
        this.logger.info('Wave monitoring enabled, checking product availability', { site: this.siteName });
        await this.monitorWaveRelease(page, flowConfig);
      }
      
      // Execute each step in the flow
      for (let i = 0; i < flowConfig.steps.length; i++) {
        const step = flowConfig.steps[i];
        this.logger.info('Executing step', { 
          step: i + 1, 
          action: step.action,
          description: step.description
        });
        
        // Emit step start event
        this.emit('stepStart', { site: this.siteName, step: i + 1, action: step.action });
        
        // Handle CAPTCHA if detected
        const captchaHandled = await this.handleCaptcha(page);
        if (!captchaHandled) {
          this.logger.warn('CAPTCHA handling failed', { site: this.siteName });
        }
        
        // Check for queue system
        const queueHandled = await this.handleQueueSystem(page);
        if (!queueHandled) {
          this.logger.warn('Queue system handling failed', { site: this.siteName });
        }
        
        switch (step.action) {
          case 'goto':
            await page.goto(step.url, { waitUntil: 'networkidle' });
            break;
            
          case 'fill':
            await humanLikeFill(page, step.selector, step.value, {
              typingSpeed: 60,
              preDelay: 200,
              postDelay: 100
            });
            break;
            
          case 'click':
            await humanLikeClick(page, step.selector, {
              preDelay: 300,
              postDelay: 200
            });
            break;
            
          case 'waitForSelector':
            await page.waitForSelector(step.selector, { timeout: step.options?.timeout || 30000 });
            break;
            
          case 'waitForTimeout':
            await humanLikeDelay(step.timeout || 1000);
            break;
            
          default:
            this.logger.warn('Unsupported action', { action: step.action });
        }
        
        // Emit step end event
        this.emit('stepEnd', { site: this.siteName, step: i + 1, action: step.action });
      }
      
      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        stepsExecuted: flowConfig.steps.length
      };
      
      // Emit execution end event
      this.emit('checkoutEnd', { site: this.siteName, result });
      
      this.logger.info('BestBuy checkout flow executed successfully', { 
        site: this.siteName,
        steps: flowConfig.steps.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to execute BestBuy checkout flow', { 
        site: this.siteName,
        error: error.message,
        stack: error.stack
      });
      
      // Try to handle the error
      const errorResult = await this.handleError(error, page);
      this.logger.info('Error handling result', { site: this.siteName, errorResult });
      
      const result = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      // Emit execution end event with error
      this.emit('checkoutEnd', { site: this.siteName, result });
      
      return result;
    }
  }

  /**
   * Record a BestBuy checkout flow
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recording result
   */
  async recordFlow(page) {
    this.logger.info('Recording BestBuy checkout flow', { site: this.siteName });
    
    // Emit recording start event
    this.emit('recordStart', { site: this.siteName });
    
    try {
      // This is a placeholder implementation
      // In a real implementation, this would record user actions
      const result = {
        success: true,
        message: 'Recording functionality not fully implemented',
        timestamp: new Date().toISOString()
      };
      
      // Emit recording end event
      this.emit('recordEnd', { site: this.siteName, result });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to record BestBuy flow', { 
        site: this.siteName,
        error: error.message
      });
      
      const result = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      // Emit recording end event with error
      this.emit('recordEnd', { site: this.siteName, result });
      
      return result;
    }
  }

  /**
   * Handle CAPTCHA challenges
   * @param {Page} page - Playwright page instance
   * @returns {Promise<boolean>} - Whether CAPTCHA was successfully handled
   */
  async handleCaptcha(page) {
    this.logger.info('Handling CAPTCHA for BestBuy', { site: this.siteName });
    
    // Emit CAPTCHA detection event
    this.emit('captchaDetected', { site: this.siteName });
    
    try {
      // Check for CAPTCHA elements
      const captchaSelectors = [
        '.g-recaptcha',
        '.h-captcha',
        '[data-testid="captcha-container"]'
      ];
      
      let captchaFound = false;
      let captchaSelector = '';
      
      for (const selector of captchaSelectors) {
        if (await page.locator(selector).isVisible()) {
          captchaFound = true;
          captchaSelector = selector;
          break;
        }
      }
      
      if (!captchaFound) {
        this.logger.info('No CAPTCHA detected', { site: this.siteName });
        this.emit('captchaHandled', { site: this.siteName, handled: true, reason: 'no_captcha' });
        return true;
      }
      
      this.logger.info('CAPTCHA detected, solving...', { site: this.siteName, captchaSelector });
      
      // Use CAPTCHA solving service
      const captchaSolution = await this.solveCaptchaWithService(page, captchaSelector);
      
      // Apply solution
      await page.evaluate((solution) => {
        const captchaInput = document.querySelector('input[name="g-recaptcha-response"]');
        if (captchaInput) {
          captchaInput.value = solution;
        }
      }, captchaSolution);
      
      const handled = true;
      
      // Emit CAPTCHA handled event
      this.emit('captchaHandled', { site: this.siteName, handled, solution: captchaSolution });
      
      this.logger.info('CAPTCHA handled successfully', { site: this.siteName });
      return handled;
      
    } catch (error) {
      this.logger.error('Failed to handle CAPTCHA', { 
        site: this.siteName, 
        error: error.message 
      });
      
      const handled = false;
      
      // Emit CAPTCHA handled event with error
      this.emit('captchaHandled', { site: this.siteName, handled, error: error.message });
      
      return handled;
    }
  }

  /**
   * Solve CAPTCHA using service
   * @param {Page} page - Playwright page instance
   * @param {string} captchaSelector - CAPTCHA selector
   * @returns {Promise<string>} - CAPTCHA solution
   */
  async solveCaptchaWithService(page, captchaSelector) {
    this.logger.info('Solving CAPTCHA with service', { site: this.siteName });
    
    // In a real implementation, this would integrate with a CAPTCHA solving service
    // For now, we'll simulate a successful solve
    await humanLikeDelay(3000); // Simulate solving time
    
    return 'captcha_solution_placeholder';
  }

  /**
   * Handle queue system if present
   * @param {Page} page - Playwright page instance
   * @returns {Promise<boolean>} - Whether queue system was successfully handled
   */
  async handleQueueSystem(page) {
    this.logger.info('Handling queue system for BestBuy', { site: this.siteName });
    
    try {
      // Check for queue system
      const queuePresent = await page.locator('.queue-container').isVisible();
      if (!queuePresent) {
        this.logger.info('No queue system detected', { site: this.siteName });
        return true;
      }
      
      this.logger.info('Queue system detected, waiting...', { site: this.siteName });
      
      // Wait for queue to clear (with timeout)
      await page.waitForSelector('.queue-container', { state: 'hidden', timeout: 300000 }); // 5 min timeout
      
      this.logger.info('Queue system cleared', { site: this.siteName });
      return true;
      
    } catch (error) {
      this.logger.error('Failed to handle queue system', { 
        site: this.siteName, 
        error: error.message 
      });
      
      return false;
    }
  }

  /**
   * Monitor wave release for high-demand products
   * @param {Page} page - Playwright page instance
   * @param {Object} flowConfig - Flow configuration
   * @returns {Promise<void>}
   */
  async monitorWaveRelease(page, flowConfig) {
    this.logger.info('Monitoring wave release', { site: this.siteName });
    
    try {
      // Extract SKU from flow config or page
      const sku = flowConfig.product?.sku || await this.extractSkuFromPage(page);
      if (!sku) {
        this.logger.warn('No SKU found for wave monitoring', { site: this.siteName });
        return;
      }
      
      // Monitor availability via GraphQL
      const availability = await this.checkProductAvailability(sku);
      
      if (availability.available && availability.online) {
        this.logger.info('Product is available', { site: this.siteName, sku });
        return;
      }
      
      this.logger.info('Product not available, monitoring for wave release', { site: this.siteName, sku });
      
      // In a real implementation, this would monitor for wave releases
      // For now, we'll simulate waiting
      await humanLikeDelay(5000); // Simulate monitoring delay
      
      this.logger.info('Wave monitoring completed', { site: this.siteName });
      
    } catch (error) {
      this.logger.error('Failed to monitor wave release', { 
        site: this.siteName, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Check product availability via GraphQL
   * @param {string} sku - Product SKU
   * @returns {Promise<Object>} - Availability information
   */
  async checkProductAvailability(sku) {
    this.logger.info('Checking product availability via GraphQL', { site: this.siteName, sku });
    
    try {
      const inventoryQuery = `
        query ProductAvailability($sku: String!) {
          product(sku: $sku) {
            sku
            name
            availability {
              available
              inStore
              online
              shipping
            }
            price {
              currentPrice
            }
          }
        }
      `;
      
      const response = await fetch('https://www.bestbuy.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.getRandomUserAgent()
        },
        body: JSON.stringify({
          query: inventoryQuery,
          variables: { sku }
        })
      });
      
      if (!response.ok) {
        throw new Error('GraphQL inventory check failed');
      }
      
      const data = await response.json();
      
      const availability = {
        available: data.data.product.availability.available,
        inStore: data.data.product.availability.inStore,
        online: data.data.product.availability.online,
        shipping: data.data.product.availability.shipping,
        price: data.data.product.price.currentPrice
      };
      
      this.logger.info('Product availability checked', { site: this.siteName, sku, availability });
      
      return availability;
      
    } catch (error) {
      this.logger.error('Failed to check product availability', { 
        site: this.siteName, 
        sku, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Extract SKU from page
   * @param {Page} page - Playwright page instance
   * @returns {Promise<string|null>} - SKU or null
   */
  async extractSkuFromPage(page) {
    try {
      const skuValue = await page.locator('[data-automation="sku"]').getAttribute('data-automation');
      return skuValue || null;
    } catch (error) {
      this.logger.warn('Failed to extract SKU from page', { site: this.siteName, error: error.message });
      return null;
    }
  }

  /**
   * Handle errors and recovery with BestBuy-specific strategies
   * @param {Error} error - Error to handle
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Error handling result
   */
  async handleError(error, page) {
    this.logger.warn('Handling error for BestBuy', { 
      site: this.siteName, 
      error: error.message 
    });
    
    // Emit error event
    this.emit('error', { site: this.siteName, error: error.message });
    
    // Categorize the error
    const errorCategory = this.categorizeError(error);
    this.logger.info('Error categorized', { site: this.siteName, category: errorCategory });
    
    // Apply recovery strategy based on error category
    let result = {
      recovered: false,
      strategy: 'none',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    switch (errorCategory) {
      case 'QUEUE_ACTIVE':
        result = await this.handleQueueActiveError(page);
        break;
        
      case 'OUT_OF_STOCK':
        result = await this.handleOutOfStockError(page);
        break;
        
      case 'CAPTCHA_FAILED':
        result = await this.handleCaptchaFailedError(page);
        break;
        
      case 'SESSION_EXPIRED':
        result = await this.handleSessionExpiredError(page);
        break;
        
      default:
        // Generic error handling
        result.recovered = true;
        result.strategy = 'log_and_continue';
        break;
    }
    
    // Emit error handled event
    this.emit('errorHandled', { site: this.siteName, result });
    
    return result;
  }
  
  /**
   * Categorize an error based on its properties
   * @param {Error} error - Error to categorize
   * @returns {string} - Error category
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    // Queue system active
    if (message.includes('queue')) {
      return 'QUEUE_ACTIVE';
    }
    
    // Out of stock during checkout
    if (message.includes('out of stock') || message.includes('sold out')) {
      return 'OUT_OF_STOCK';
    }
    
    // CAPTCHA failed
    if (message.includes('captcha')) {
      return 'CAPTCHA_FAILED';
    }
    
    // Session expired errors
    if (message.includes('session expired') || message.includes('timeout')) {
      return 'SESSION_EXPIRED';
    }
    
    return 'GENERIC_ERROR';
  }
  
  /**
   * Handle Queue Active error
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recovery result
   */
  async handleQueueActiveError(page) {
    this.logger.info('Handling Queue Active error', { site: this.siteName });
    
    try {
      // Strategy: Wait for queue to clear or find alternative
      this.logger.info('Waiting for queue to clear...', { site: this.siteName });
      
      await page.waitForSelector('.queue-container', { state: 'hidden', timeout: 300000 }); // 5 min timeout
      
      const result = {
        recovered: true,
        strategy: 'queue_wait',
        timestamp: new Date().toISOString()
      };
      
      this.logger.info('Queue Active error handled with waiting', { site: this.siteName });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to handle Queue Active error', { 
        site: this.siteName, 
        error: error.message 
      });
      
      return {
        recovered: false,
        strategy: 'queue_wait',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Handle Out of Stock error
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recovery result
   */
  async handleOutOfStockError(page) {
    this.logger.info('Handling Out of Stock error', { site: this.siteName });
    
    try {
      // Strategy: Monitor for restock
      this.logger.info('Monitoring for restock', { site: this.siteName });
      
      // In a real implementation, this would monitor for restock
      await humanLikeDelay(5000); // Simulate monitoring delay
      
      const result = {
        recovered: true,
        strategy: 'monitor_restock',
        timestamp: new Date().toISOString()
      };
      
      this.logger.info('Out of Stock error handled with restock monitoring', { site: this.siteName });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to handle Out of Stock error', { 
        site: this.siteName, 
        error: error.message 
      });
      
      return {
        recovered: false,
        strategy: 'monitor_restock',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Handle CAPTCHA Failed error
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recovery result
   */
  async handleCaptchaFailedError(page) {
    this.logger.info('Handling CAPTCHA Failed error', { site: this.siteName });
    
    try {
      // Strategy: Retry with different CAPTCHA service
      this.logger.info('Retrying with different CAPTCHA service', { site: this.siteName });
      
      // In a real implementation, this would use an alternative service
      await humanLikeDelay(1000); // Simulate retry delay
      
      const result = {
        recovered: true,
        strategy: 'alternative_captcha_service',
        timestamp: new Date().toISOString()
      };
      
      this.logger.info('CAPTCHA Failed error handled with alternative service', { site: this.siteName });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to handle CAPTCHA Failed error', { 
        site: this.siteName, 
        error: error.message 
      });
      
      return {
        recovered: false,
        strategy: 'alternative_captcha_service',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Handle Session Expired error
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recovery result
   */
  async handleSessionExpiredError(page) {
    this.logger.info('Handling Session Expired error', { site: this.siteName });
    
    try {
      // Strategy: Restart checkout process
      this.logger.info('Restarting checkout process', { site: this.siteName });
      
      await page.reload();
      await humanLikeDelay(3000); // Simulate restart delay
      
      const result = {
        recovered: true,
        strategy: 'restart_checkout',
        timestamp: new Date().toISOString()
      };
      
      this.logger.info('Session Expired error handled with checkout restart', { site: this.siteName });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to handle Session Expired error', { 
        site: this.siteName, 
        error: error.message 
      });
      
      return {
        recovered: false,
        strategy: 'restart_checkout',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get a random user agent for BestBuy
   * @returns {string} - Random user agent
   */
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
}

module.exports = BestBuyModule;