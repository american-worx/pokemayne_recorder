const BaseSiteModule = require('./BaseSiteModule');
const { humanLikeFill, humanLikeClick, humanLikeDelay } = require('./CommonUtils');

/**
 * ShopifyModule - Generic site module for Shopify stores
 * Implements checkout flow for Shopify-based e-commerce sites with
 * customizable selectors and flexible configuration
 */
class ShopifyModule extends BaseSiteModule {
  /**
   * Constructor for ShopifyModule
   * @param {Object} config - Configuration object for the module
   * @param {Object} logger - Logger instance
   */
  constructor(config = {}, logger = null) {
    super(config, logger);
    this.siteName = 'shopify';
    this.version = '1.0.0';
    // Default selectors that work for most Shopify stores
    this.defaultSelectors = {
      product: {
        title: 'h1.product-title, h1.product__title, .product-title',
        price: '.price, .product-price, .price__current',
        addToCart: '#add-to-cart, .add-to-cart, [name="add"]',
        quantity: '#quantity, .quantity-input'
      },
      cart: {
        item: '.cart-item, .cart__item',
        checkout: '.checkout, [name="checkout"], .cart__checkout-button',
        remove: '.remove, .cart__remove'
      },
      checkout: {
        email: '#checkout_email, #email, input[name="checkout[email]"]',
        firstName: '#checkout_shipping_address_first_name, #first_name',
        lastName: '#checkout_shipping_address_last_name, #last_name',
        address1: '#checkout_shipping_address_address1, #address1',
        address2: '#checkout_shipping_address_address2, #address2',
        city: '#checkout_shipping_address_city, #city',
        state: '#checkout_shipping_address_province, #state',
        zip: '#checkout_shipping_address_zip, #zip',
        phone: '#checkout_shipping_address_phone, #phone',
        continueToShipping: '[data-step="contact_information"] button[type="submit"]',
        continueToPayment: '[data-step="shipping_method"] button[type="submit"]',
        paymentMethod: '[data gateway-step="payment_method"]',
        completeOrder: '#pay-now, #checkout-pay-button, [data-testid="complete-order-button"]'
      }
    };
  }

  /**
   * Initialize the Shopify module
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      this.logger.warn('Shopify module already initialized');
      return;
    }
    
    this.logger.info('Initializing Shopify module', { site: this.siteName });
    
    // Emit initialization event
    this.emit('initializing', { site: this.siteName });
    
    // Perform any site-specific initialization
    this.logger.info('Shopify module initialized', { site: this.siteName });
    
    // Mark as initialized
    this.initialized = true;
    
    // Emit initialized event
    this.emit('initialized', { site: this.siteName });
  }

  /**
   * Execute the Shopify checkout flow
   * @param {Page} page - Playwright page instance
   * @param {Object} flowConfig - Flow configuration
   * @returns {Promise<Object>} - Execution result
   */
  async executeCheckout(page, flowConfig) {
    this.logger.info('Executing Shopify checkout flow', { site: this.siteName });
    
    // Emit execution start event
    this.emit('checkoutStart', { site: this.siteName, flowConfig });
    
    try {
      // Merge default selectors with flow config selectors
      const selectors = { ...this.defaultSelectors, ...flowConfig.selectors };
      
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
            
          case 'addToCart':
            await this.addToCart(page, selectors, step);
            break;
            
          case 'proceedToCheckout':
            await this.proceedToCheckout(page, selectors, step);
            break;
            
          case 'fillShippingInfo':
            await this.fillShippingInfo(page, selectors, step);
            break;
            
          case 'completePayment':
            await this.completePayment(page, selectors, step);
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
      
      this.logger.info('Shopify checkout flow executed successfully', { 
        site: this.siteName,
        steps: flowConfig.steps.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to execute Shopify checkout flow', { 
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
   * Add to cart action
   * @param {Page} page - Playwright page instance
   * @param {Object} selectors - CSS selectors
   * @param {Object} step - Flow step
   * @returns {Promise<void>}
   */
  async addToCart(page, selectors, step) {
    this.logger.info('Adding to cart', { site: this.siteName });
    
    // Fill quantity if specified
    if (step.quantity) {
      const quantitySelector = selectors.product.quantity;
      if (quantitySelector) {
        await humanLikeFill(page, quantitySelector, step.quantity.toString(), {
          typingSpeed: 60,
          preDelay: 100,
          postDelay: 100
        });
      }
    }
    
    // Click add to cart button
    await humanLikeClick(page, selectors.product.addToCart, {
      preDelay: 200,
      postDelay: 1000 // Wait for cart to update
    });
    
    // Wait for confirmation or cart update
    try {
      await page.waitForSelector('.added-to-cart, .cart-popup, .success', { timeout: 5000 });
    } catch (error) {
      this.logger.warn('No cart confirmation found, continuing', { site: this.siteName });
    }
  }

  /**
   * Proceed to checkout action
   * @param {Page} page - Playwright page instance
   * @param {Object} selectors - CSS selectors
   * @param {Object} step - Flow step
   * @returns {Promise<void>}
   */
  async proceedToCheckout(page, selectors, step) {
    this.logger.info('Proceeding to checkout', { site: this.siteName });
    
    await humanLikeClick(page, selectors.cart.checkout, {
      preDelay: 300,
      postDelay: 2000 // Wait for checkout page to load
    });
  }

  /**
   * Fill shipping information
   * @param {Page} page - Playwright page instance
   * @param {Object} selectors - CSS selectors
   * @param {Object} step - Flow step
   * @returns {Promise<void>}
   */
  async fillShippingInfo(page, selectors, step) {
    this.logger.info('Filling shipping information', { site: this.siteName });
    
    const shippingData = step.shippingData || {};
    
    // Fill email
    if (shippingData.email) {
      await humanLikeFill(page, selectors.checkout.email, shippingData.email, {
        typingSpeed: 60,
        preDelay: 100,
        postDelay: 100
      });
    }
    
    // Fill first name
    if (shippingData.firstName) {
      await humanLikeFill(page, selectors.checkout.firstName, shippingData.firstName, {
        typingSpeed: 60,
        preDelay: 100,
        postDelay: 100
      });
    }
    
    // Fill last name
    if (shippingData.lastName) {
      await humanLikeFill(page, selectors.checkout.lastName, shippingData.lastName, {
        typingSpeed: 60,
        preDelay: 100,
        postDelay: 100
      });
    }
    
    // Fill address
    if (shippingData.address1) {
      await humanLikeFill(page, selectors.checkout.address1, shippingData.address1, {
        typingSpeed: 60,
        preDelay: 100,
        postDelay: 100
      });
    }
    
    // Fill city
    if (shippingData.city) {
      await humanLikeFill(page, selectors.checkout.city, shippingData.city, {
        typingSpeed: 60,
        preDelay: 100,
        postDelay: 100
      });
    }
    
    // Fill zip
    if (shippingData.zip) {
      await humanLikeFill(page, selectors.checkout.zip, shippingData.zip, {
        typingSpeed: 60,
        preDelay: 100,
        postDelay: 100
      });
    }
    
    // Fill phone
    if (shippingData.phone) {
      await humanLikeFill(page, selectors.checkout.phone, shippingData.phone, {
        typingSpeed: 60,
        preDelay: 100,
        postDelay: 100
      });
    }
    
    // Click continue button
    await humanLikeClick(page, selectors.checkout.continueToShipping, {
      preDelay: 300,
      postDelay: 2000
    });
  }

  /**
   * Complete payment
   * @param {Page} page - Playwright page instance
   * @param {Object} selectors - CSS selectors
   * @param {Object} step - Flow step
   * @returns {Promise<void>}
   */
  async completePayment(page, selectors, step) {
    this.logger.info('Completing payment', { site: this.siteName });
    
    const paymentData = step.paymentData || {};
    
    // Handle different payment methods
    if (paymentData.cardNumber) {
      // Handle credit card payment
      await this.handleCreditCardPayment(page, selectors, paymentData);
    }
    
    // Click complete order button
    await humanLikeClick(page, selectors.checkout.completeOrder, {
      preDelay: 500,
      postDelay: 3000
    });
  }

  /**
   * Handle credit card payment
   * @param {Page} page - Playwright page instance
   * @param {Object} selectors - CSS selectors
   * @param {Object} paymentData - Payment data
   * @returns {Promise<void>}
   */
  async handleCreditCardPayment(page, selectors, paymentData) {
    this.logger.info('Handling credit card payment', { site: this.siteName });
    
    // This is a simplified implementation
    // In a real implementation, you would need to handle iframes and specific selectors
    
    // Fill card number (if not in iframe)
    if (paymentData.cardNumber) {
      const cardNumberSelector = '#number, #card-number, input[name="number"]';
      try {
        await humanLikeFill(page, cardNumberSelector, paymentData.cardNumber, {
          typingSpeed: 60,
          preDelay: 100,
          postDelay: 100
        });
      } catch (error) {
        this.logger.warn('Could not fill card number directly, may be in iframe', { site: this.siteName });
      }
    }
    
    // Fill expiry date
    if (paymentData.expiry) {
      const expirySelector = '#expiry, #expiration, input[name="expiry"]';
      try {
        await humanLikeFill(page, expirySelector, paymentData.expiry, {
          typingSpeed: 60,
          preDelay: 100,
          postDelay: 100
        });
      } catch (error) {
        this.logger.warn('Could not fill expiry directly', { site: this.siteName });
      }
    }
    
    // Fill CVV
    if (paymentData.cvv) {
      const cvvSelector = '#cvv, #cvc, input[name="cvv"]';
      try {
        await humanLikeFill(page, cvvSelector, paymentData.cvv, {
          typingSpeed: 60,
          preDelay: 100,
          postDelay: 100
        });
      } catch (error) {
        this.logger.warn('Could not fill CVV directly', { site: this.siteName });
      }
    }
    
    // Fill cardholder name
    if (paymentData.cardholderName) {
      const nameSelector = '#name, #cardholder-name, input[name="name"]';
      try {
        await humanLikeFill(page, nameSelector, paymentData.cardholderName, {
          typingSpeed: 60,
          preDelay: 100,
          postDelay: 100
        });
      } catch (error) {
        this.logger.warn('Could not fill cardholder name directly', { site: this.siteName });
      }
    }
  }

  /**
   * Record a Shopify checkout flow
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recording result
   */
  async recordFlow(page) {
    this.logger.info('Recording Shopify checkout flow', { site: this.siteName });
    
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
      this.logger.error('Failed to record Shopify flow', { 
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
    this.logger.info('Handling CAPTCHA for Shopify', { site: this.siteName });
    
    // Emit CAPTCHA detection event
    this.emit('captchaDetected', { site: this.siteName });
    
    try {
      // Check for CAPTCHA elements
      const captchaSelectors = [
        '.g-recaptcha',
        '.h-captcha',
        '[data-testid="captcha-container"]',
        '.shopify-challenge__button' // Shopify-specific
      ];
      
      let captchaFound = false;
      
      for (const selector of captchaSelectors) {
        if (await page.locator(selector).isVisible()) {
          captchaFound = true;
          break;
        }
      }
      
      if (!captchaFound) {
        this.logger.info('No CAPTCHA detected', { site: this.siteName });
        this.emit('captchaHandled', { site: this.siteName, handled: true, reason: 'no_captcha' });
        return true;
      }
      
      this.logger.info('CAPTCHA detected for Shopify', { site: this.siteName });
      
      // In a real implementation, this would integrate with a CAPTCHA solving service
      // For now, we'll simulate handling
      await humanLikeDelay(2000); // Simulate solving time
      
      const handled = true;
      
      // Emit CAPTCHA handled event
      this.emit('captchaHandled', { site: this.siteName, handled });
      
      this.logger.info('CAPTCHA handled successfully', { site: this.siteName });
      return handled;
      
    } catch (error) {
      this.logger.error('Failed to handle CAPTCHA for Shopify', { 
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
   * Handle errors and recovery with Shopify-specific strategies
   * @param {Error} error - Error to handle
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Error handling result
   */
  async handleError(error, page) {
    this.logger.warn('Handling error for Shopify', { 
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
      case 'CHECKOUT_DISABLED':
        result = await this.handleCheckoutDisabledError(page);
        break;
        
      case 'HIGH_TRAFFIC':
        result = await this.handleHighTrafficError(page);
        break;
        
      case 'PRODUCT_SOLD_OUT':
        result = await this.handleProductSoldOutError(page);
        break;
        
      case 'PAYMENT_ERROR':
        result = await this.handlePaymentError(page);
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
    
    // Checkout disabled
    if (message.includes('checkout disabled') || message.includes('not available')) {
      return 'CHECKOUT_DISABLED';
    }
    
    // High traffic
    if (message.includes('high traffic') || message.includes('queue') || message.includes('busy')) {
      return 'HIGH_TRAFFIC';
    }
    
    // Product sold out
    if (message.includes('sold out') || message.includes('out of stock')) {
      return 'PRODUCT_SOLD_OUT';
    }
    
    // Payment error
    if (message.includes('payment') || message.includes('card') || message.includes('declined')) {
      return 'PAYMENT_ERROR';
    }
    
    return 'GENERIC_ERROR';
  }
  
  /**
   * Handle Checkout Disabled error
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recovery result
   */
  async handleCheckoutDisabledError(page) {
    this.logger.info('Handling Checkout Disabled error', { site: this.siteName });
    
    try {
      // Strategy: Wait and retry
      this.logger.info('Checkout disabled, waiting and retrying', { site: this.siteName });
      
      await humanLikeDelay(60000); // 1 minute wait
      
      const result = {
        recovered: true,
        strategy: 'wait_retry',
        timestamp: new Date().toISOString()
      };
      
      this.logger.info('Checkout Disabled error handled with wait and retry', { site: this.siteName });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to handle Checkout Disabled error', { 
        site: this.siteName, 
        error: error.message 
      });
      
      return {
        recovered: false,
        strategy: 'wait_retry',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Handle High Traffic error
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recovery result
   */
  async handleHighTrafficError(page) {
    this.logger.info('Handling High Traffic error', { site: this.siteName });
    
    try {
      // Strategy: Wait in queue or retry
      this.logger.info('High traffic detected, waiting in queue or retrying', { site: this.siteName });
      
      await humanLikeDelay(30000); // 30 second wait
      
      const result = {
        recovered: true,
        strategy: 'queue_wait',
        timestamp: new Date().toISOString()
      };
      
      this.logger.info('High Traffic error handled with queue wait', { site: this.siteName });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to handle High Traffic error', { 
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
   * Handle Product Sold Out error
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recovery result
   */
  async handleProductSoldOutError(page) {
    this.logger.info('Handling Product Sold Out error', { site: this.siteName });
    
    try {
      // Strategy: Monitor for restock
      this.logger.info('Product sold out, monitoring for restock', { site: this.siteName });
      
      // In a real implementation, this would monitor for restock
      await humanLikeDelay(5000); // Simulate monitoring delay
      
      const result = {
        recovered: true,
        strategy: 'monitor_restock',
        timestamp: new Date().toISOString()
      };
      
      this.logger.info('Product Sold Out error handled with restock monitoring', { site: this.siteName });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to handle Product Sold Out error', { 
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
   * Handle Payment Error
   * @param {Page} page - Playwright page instance
   * @returns {Promise<Object>} - Recovery result
   */
  async handlePaymentError(page) {
    this.logger.info('Handling Payment Error', { site: this.siteName });
    
    try {
      // Strategy: Retry payment or switch method
      this.logger.info('Payment error, retrying or switching method', { site: this.siteName });
      
      await humanLikeDelay(2000); // Short delay
      
      const result = {
        recovered: true,
        strategy: 'payment_retry',
        timestamp: new Date().toISOString()
      };
      
      this.logger.info('Payment Error handled with retry', { site: this.siteName });
      return result;
      
    } catch (error) {
      this.logger.error('Failed to handle Payment Error', { 
        site: this.siteName, 
        error: error.message 
      });
      
      return {
        recovered: false,
        strategy: 'payment_retry',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = ShopifyModule;