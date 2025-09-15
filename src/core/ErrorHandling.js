const winston = require('winston');

/**
 * ErrorHandling - Comprehensive error recovery and logging system
 */
class ErrorHandling {
  constructor(logger) {
    this.logger = logger;
    this.errorCounts = new Map();
    this.recoveryStrategies = new Map();
    this.registerDefaultRecoveryStrategies();
  }

  /**
   * Handle an error with appropriate recovery strategy
   * @param {Error} error - Error to handle
   * @param {Object} context - Context information
   * @returns {Object} - Recovery result
   */
  async handleError(error, context = {}) {
    this.logger.error('Error occurred', { 
      error: error.message,
      stack: error.stack,
      context
    });

    // Categorize the error
    const errorCategory = this.categorizeError(error);
    
    // Increment error count for this category
    const currentCount = this.errorCounts.get(errorCategory) || 0;
    this.errorCounts.set(errorCategory, currentCount + 1);
    
    this.logger.info('Error categorized', { category: errorCategory, count: currentCount + 1 });

    // Try to apply recovery strategy
    const strategy = this.recoveryStrategies.get(errorCategory);
    if (strategy) {
      try {
        this.logger.info('Applying recovery strategy', { category: errorCategory });
        const result = await strategy(error, context, currentCount);
        this.logger.info('Recovery strategy applied', { category: errorCategory, success: result.success });
        return result;
      } catch (recoveryError) {
        this.logger.error('Recovery strategy failed', { 
          category: errorCategory,
          error: recoveryError.message,
          stack: recoveryError.stack
        });
      }
    }

    // If no specific strategy or strategy failed, apply generic backoff
    const backoffResult = await this.applyBackoff(error, context, currentCount);
    return backoffResult;
  }

  /**
   * Categorize an error based on its properties
   * @param {Error} error - Error to categorize
   * @returns {string} - Error category
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('timeout') || message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    
    // Rate limiting errors
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
      return 'RATE_LIMIT_ERROR';
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('401') || message.includes('forbidden') || message.includes('403')) {
      return 'AUTH_ERROR';
    }
    
    // Selector errors
    if (message.includes('selector') || message.includes('element') || message.includes('not found')) {
      return 'SELECTOR_ERROR';
    }
    
    // CAPTCHA errors
    if (message.includes('captcha') || message.includes('challenge')) {
      return 'CAPTCHA_ERROR';
    }
    
    // Proxy errors
    if (message.includes('proxy')) {
      return 'PROXY_ERROR';
    }
    
    // Default category
    return 'GENERIC_ERROR';
  }

  /**
   * Register default recovery strategies
   */
  registerDefaultRecoveryStrategies() {
    // Network error recovery
    this.recoveryStrategies.set('NETWORK_ERROR', async (error, context, count) => {
      const delay = this.calculateExponentialBackoff(count);
      this.logger.info('Network error recovery: Applying backoff', { delay });
      await this.sleep(delay);
      return { success: true, strategy: 'BACKOFF', delay };
    });

    // Rate limit error recovery
    this.recoveryStrategies.set('RATE_LIMIT_ERROR', async (error, context, count) => {
      const delay = this.calculateExponentialBackoff(count, 5000); // Start with 5 second delay
      this.logger.info('Rate limit error recovery: Applying backoff', { delay });
      await this.sleep(delay);
      return { success: true, strategy: 'BACKOFF', delay };
    });

    // Selector error recovery
    this.recoveryStrategies.set('SELECTOR_ERROR', async (error, context, count) => {
      if (count < 2) {
        // Try to wait a bit and retry
        await this.sleep(2000);
        return { success: true, strategy: 'WAIT_AND_RETRY' };
      } else {
        // Try alternative selectors if available
        this.logger.warn('Selector error: No alternative selectors available');
        return { success: false, strategy: 'NO_ALTERNATIVE' };
      }
    });

    // CAPTCHA error recovery
    this.recoveryStrategies.set('CAPTCHA_ERROR', async (error, context, count) => {
      if (count < 3) {
        // Wait and retry
        await this.sleep(5000);
        return { success: true, strategy: 'WAIT_AND_RETRY' };
      } else {
        // Mark as CAPTCHA requiring manual intervention
        return { success: false, strategy: 'MANUAL_INTERVENTION_REQUIRED' };
      }
    });

    // Proxy error recovery
    this.recoveryStrategies.set('PROXY_ERROR', async (error, context, count) => {
      // Rotate to a new proxy if available
      return { success: false, strategy: 'PROXY_ROTATION_REQUIRED' };
    });
  }

  /**
   * Register a custom recovery strategy
   * @param {string} category - Error category
   * @param {Function} strategy - Recovery strategy function
   */
  registerRecoveryStrategy(category, strategy) {
    this.logger.info('Registering custom recovery strategy', { category });
    this.recoveryStrategies.set(category, strategy);
  }

  /**
   * Apply exponential backoff
   * @param {Error} error - Error that triggered backoff
   * @param {Object} context - Context information
   * @param {number} count - Number of times this error has occurred
   * @returns {Object} - Backoff result
   */
  async applyBackoff(error, context, count) {
    const delay = this.calculateExponentialBackoff(count);
    this.logger.info('Applying exponential backoff', { delay, count });
    
    await this.sleep(delay);
    
    return {
      success: true,
      strategy: 'BACKOFF',
      delay,
      error: error.message
    };
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} count - Number of retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {number} - Delay in milliseconds
   */
  calculateExponentialBackoff(count, baseDelay = 1000) {
    const maxDelay = 300000; // 5 minutes
    const jitter = Math.random() * 1000; // Up to 1 second jitter
    
    const delay = Math.min(baseDelay * Math.pow(2, count) + jitter, maxDelay);
    return Math.max(delay, baseDelay);
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after specified time
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error counts by category
   * @returns {Map} - Error counts by category
   */
  getErrorCounts() {
    return new Map(this.errorCounts);
  }

  /**
   * Reset error counts
   */
  resetErrorCounts() {
    this.errorCounts.clear();
  }

  /**
   * Create a detailed error report
   * @returns {Object} - Error report
   */
  generateErrorReport() {
    const report = {
      timestamp: new Date().toISOString(),
      errorCounts: Object.fromEntries(this.errorCounts),
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      categories: Array.from(this.errorCounts.keys())
    };
    
    return report;
  }

  /**
   * Log error statistics
   */
  logErrorStatistics() {
    const report = this.generateErrorReport();
    this.logger.info('Error statistics', report);
  }
}

module.exports = ErrorHandling;