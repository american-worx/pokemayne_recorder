import logger from '../core/utils/logger.js';
// import { getWalmartOptimizedUserAgent } from '../core/utils/user-agents.js';
// import { getWalmartOptimizedViewport } from '../core/utils/viewports.js';

class WalmartModule {
  constructor(options = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 2000,
      captchaSolver: options.captchaSolver || '2captcha',
      timeout: options.timeout || 60000,
      humanBehavior: options.humanBehavior ?? true,
      ...options
    };

    this.selectors = {
      product: {
        title: '.prod-ProductTitle',
        price: '.prod-PriceSection .price-characteristic',
        availability: '.prod-ProductCTA .prod-ProductCTAButton',
        addToCart: '#add-to-cart-btn',
        outOfStock: '.prod-ProductOOS',
        itemDemand: '[data-testid="item-demand"]'
      },
      cart: {
        cartIcon: '.cart-icon',
        cartButton: '#checkout-button',
        cartList: '.cart-list',
        cartItem: '.cart-item'
      },
      checkout: {
        guestButton: '[data-testid="guest-checkout-btn"]',
        emailInput: '#email',
        continueButton: '[data-testid="continue-guest"]'
      },
      shipping: {
        firstName: '#firstName',
        lastName: '#lastName',
        address1: '#addressLineOne',
        address2: '#addressLineTwo',
        city: '#city',
        state: '#state',
        zipCode: '#postalCode',
        phone: '#phone',
        continueButton: '[data-testid="shipping-continue"]'
      },
      payment: {
        cardNumber: '#creditCardNumber',
        expiryMonth: '#expirationDateMonth',
        expiryYear: '#expirationDateYear',
        cvv: '#cvv',
        cardholderName: '#cardholderName',
        submitButton: '#checkout-submit-btn'
      },
      captcha: {
        recaptcha: '.g-recaptcha',
        hcaptcha: '.h-captcha',
        container: '[data-testid="captcha-container"]'
      },
      confirmation: {
        orderNumber: '.order-number',
        confirmation: '.order-confirmation'
      }
    };
  }

  async executeCheckout(page, config) {
    logger.automationStep('walmart_checkout_start', {
      productUrl: config.product.url,
      sessionId: config.sessionId
    });

    try {
      // Phase 1: Navigate to product and verify availability
      await this.navigateToProduct(page, config);

      // Phase 2: Add to cart
      await this.addToCart(page, config);

      // Phase 3: Navigate to cart and proceed to checkout
      await this.proceedToCheckout(page, config);

      // Phase 4: Guest checkout setup
      await this.setupGuestCheckout(page, config);

      // Phase 5: Fill shipping information
      await this.fillShippingInfo(page, config);

      // Phase 6: Fill payment information
      await this.fillPaymentInfo(page, config);

      // Phase 7: Handle CAPTCHA and submit order
      const orderResult = await this.submitOrder(page, config);

      logger.automationStep('walmart_checkout_complete', {
        orderNumber: orderResult.orderNumber,
        success: true
      });

      return orderResult;

    } catch (error) {
      logger.automationError(error, { phase: 'checkout', config });
      throw error;
    }
  }

  async navigateToProduct(page, config) {
    logger.automationStep('navigate_to_product', { url: config.product.url });

    await page.goto(config.product.url, {
      waitUntil: 'networkidle',
      timeout: this.options.timeout
    });

    // Wait for product page to load
    await page.waitForSelector(this.selectors.product.title, { timeout: 10000 });

    // Check for item demand or out of stock
    const itemDemand = await page.locator(this.selectors.product.itemDemand).isVisible();
    const outOfStock = await page.locator(this.selectors.product.outOfStock).isVisible();

    if (itemDemand) {
      throw new Error('Product has high demand - requires special handling');
    }

    if (outOfStock) {
      throw new Error('Product is out of stock');
    }

    // Verify product availability
    const addToCartButton = page.locator(this.selectors.product.addToCart);
    await addToCartButton.waitFor({ state: 'visible', timeout: 5000 });

    const buttonText = await addToCartButton.textContent();
    if (buttonText && !buttonText.toLowerCase().includes('add to cart')) {
      throw new Error(`Product not available for purchase: ${buttonText}`);
    }

    logger.automationStep('product_verified', { available: true });
  }

  async addToCart(page, config) {
    logger.automationStep('add_to_cart_start');

    const strategies = [
      // Strategy 1: Direct button click
      async () => {
        await this.humanClick(page, this.selectors.product.addToCart);
        await page.waitForSelector('.cart-popup', { timeout: 5000 });
      },

      // Strategy 2: API-based add to cart
      async () => {
        await this.addToCartViaAPI(page, config);
      }
    ];

    let success = false;
    for (let i = 0; i < strategies.length; i++) {
      try {
        await strategies[i]();
        success = true;
        logger.automationStep('add_to_cart_success', { strategy: i + 1 });
        break;
      } catch (error) {
        logger.automationStep('add_to_cart_strategy_failed', {
          strategy: i + 1,
          error: error.message
        });

        if (i === strategies.length - 1) {
          throw new Error('All add-to-cart strategies failed');
        }

        await this.humanDelay(1000, 3000);
      }
    }

    if (!success) {
      throw new Error('Failed to add product to cart');
    }
  }

  async addToCartViaAPI(page, config) {
    const result = await page.evaluate(async (productConfig) => {
      try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

        const payload = {
          sku: productConfig.sku,
          quantity: 1,
          storeId: '1',
          shippable: true
        };

        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || ''
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        throw new Error(`API add-to-cart failed: ${error.message}`);
      }
    }, config.product);

    logger.automationStep('api_add_to_cart_success', result);
  }

  async proceedToCheckout(page, _config) {
    logger.automationStep('proceed_to_checkout');

    // Navigate to cart
    await page.goto('https://www.walmart.com/cart', { waitUntil: 'networkidle' });
    await page.waitForSelector(this.selectors.cart.cartList, { timeout: 10000 });

    // Verify item is in cart
    const cartItems = await page.locator(this.selectors.cart.cartItem).count();
    if (cartItems === 0) {
      throw new Error('Cart is empty - add to cart may have failed');
    }

    // Click checkout button
    await this.humanClick(page, this.selectors.cart.cartButton);
    await page.waitForNavigation({ timeout: this.options.timeout });

    logger.automationStep('checkout_navigation_complete');
  }

  async setupGuestCheckout(page, config) {
    logger.automationStep('setup_guest_checkout');

    // Look for guest checkout option
    try {
      await page.waitForSelector(this.selectors.checkout.guestButton, { timeout: 5000 });
      await this.humanClick(page, this.selectors.checkout.guestButton);
    } catch (error) {
      logger.automationStep('guest_checkout_not_required');
    }

    // Fill email if required
    const emailInput = page.locator(this.selectors.checkout.emailInput);
    if (await emailInput.isVisible()) {
      await this.humanType(page, this.selectors.checkout.emailInput, config.customer.email);
      await this.humanClick(page, this.selectors.checkout.continueButton);
      await this.humanDelay(1000, 2000);
    }

    logger.automationStep('guest_checkout_complete');
  }

  async fillShippingInfo(page, config) {
    logger.automationStep('fill_shipping_info');

    const shippingData = config.customer.shipping;

    // Fill shipping form fields
    const fields = [
      { selector: this.selectors.shipping.firstName, value: shippingData.firstName },
      { selector: this.selectors.shipping.lastName, value: shippingData.lastName },
      { selector: this.selectors.shipping.address1, value: shippingData.address1 },
      { selector: this.selectors.shipping.city, value: shippingData.city },
      { selector: this.selectors.shipping.zipCode, value: shippingData.zipCode },
      { selector: this.selectors.shipping.phone, value: shippingData.phone }
    ];

    for (const field of fields) {
      if (field.value) {
        try {
          await page.waitForSelector(field.selector, { timeout: 5000 });
          await this.humanType(page, field.selector, field.value);
          await this.humanDelay(200, 800);
        } catch (error) {
          logger.automationStep('shipping_field_skipped', {
            field: field.selector,
            error: error.message
          });
        }
      }
    }

    // Handle state dropdown
    if (shippingData.state) {
      try {
        await page.selectOption(this.selectors.shipping.state, shippingData.state);
        await this.humanDelay(300, 700);
      } catch (error) {
        logger.automationStep('state_selection_failed', { error: error.message });
      }
    }

    // Continue to payment
    await this.humanClick(page, this.selectors.shipping.continueButton);
    await this.humanDelay(2000, 4000);

    logger.automationStep('shipping_info_complete');
  }

  async fillPaymentInfo(page, config) {
    logger.automationStep('fill_payment_info');

    const paymentData = config.customer.payment;

    // Handle credit card form (may be in iframe)
    try {
      // Check if card number field is in an iframe
      const cardFrame = page.frameLocator('.card-number-iframe');
      const cardInput = cardFrame.locator('input').first();

      if (await cardInput.isVisible()) {
        await cardInput.fill(paymentData.cardNumber);
      } else {
        await this.humanType(page, this.selectors.payment.cardNumber, paymentData.cardNumber);
      }
    } catch (error) {
      // Fallback to direct input
      await this.humanType(page, this.selectors.payment.cardNumber, paymentData.cardNumber);
    }

    await this.humanDelay(500, 1000);

    // Fill expiry month and year
    await page.selectOption(this.selectors.payment.expiryMonth, paymentData.expiryMonth);
    await this.humanDelay(200, 500);

    await page.selectOption(this.selectors.payment.expiryYear, paymentData.expiryYear);
    await this.humanDelay(200, 500);

    // Fill CVV
    await this.humanType(page, this.selectors.payment.cvv, paymentData.cvv);
    await this.humanDelay(200, 500);

    // Fill cardholder name
    await this.humanType(page, this.selectors.payment.cardholderName, paymentData.cardholderName);
    await this.humanDelay(500, 1000);

    logger.automationStep('payment_info_complete');
  }

  async submitOrder(page, _config) {
    logger.automationStep('submit_order');

    // Handle CAPTCHA if present
    await this.handleCaptcha(page);

    // Submit the order
    await this.humanClick(page, this.selectors.payment.submitButton);

    // Wait for order confirmation or error
    const result = await Promise.race([
      page.waitForSelector(this.selectors.confirmation.confirmation, { timeout: 30000 })
        .then(() => 'success'),
      page.waitForSelector('.error-message', { timeout: 30000 })
        .then(() => 'error'),
      page.waitForTimeout(30000)
        .then(() => 'timeout')
    ]);

    if (result === 'success') {
      // Extract order number
      let orderNumber = null;
      try {
        orderNumber = await page.locator(this.selectors.confirmation.orderNumber).textContent();
      } catch (error) {
        logger.automationStep('order_number_extraction_failed', { error: error.message });
      }

      logger.automationStep('order_submitted_successfully', { orderNumber });

      return {
        success: true,
        orderNumber,
        timestamp: Date.now()
      };
    } else if (result === 'error') {
      const errorMessage = await page.locator('.error-message').textContent();
      throw new Error(`Order submission failed: ${errorMessage}`);
    } else {
      throw new Error('Order submission timeout');
    }
  }

  async handleCaptcha(page) {
    logger.automationStep('checking_for_captcha');

    const captchaSelectors = Object.values(this.selectors.captcha);

    for (const selector of captchaSelectors) {
      try {
        const captchaElement = page.locator(selector);
        if (await captchaElement.isVisible()) {
          logger.automationStep('captcha_detected', { selector });

          // Solve CAPTCHA based on configured solver
          if (this.options.captchaSolver === '2captcha') {
            await this.solveCaptchaWith2Captcha(page, selector);
          } else {
            // Manual fallback - wait for user to solve
            logger.automationStep('manual_captcha_required');
            console.log('🔴 CAPTCHA detected - please solve manually and press Enter');
            await this.waitForUserInput();
          }

          break;
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }
  }

  async solveCaptchaWith2Captcha(_page, _captchaSelector) {
    // Implementation would integrate with 2captcha API
    logger.automationStep('captcha_solving_started', { service: '2captcha' });

    // For now, provide manual fallback
    console.log('🔴 CAPTCHA detected - automatic solving not implemented, please solve manually');
    await this.waitForUserInput();

    logger.automationStep('captcha_solved');
  }

  async waitForUserInput() {
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }

  // Human-like interaction helpers
  async humanClick(page, selector) {
    if (!this.options.humanBehavior) {
      await page.click(selector);
      return;
    }

    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await this.humanDelay(200, 800);

    // Hover before clicking
    await element.hover();
    await this.humanDelay(100, 300);

    await element.click();
  }

  async humanType(page, selector, text) {
    if (!this.options.humanBehavior) {
      await page.fill(selector, text);
      return;
    }

    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await element.click();
    await this.humanDelay(100, 300);

    // Clear existing content
    await element.fill('');
    await this.humanDelay(100, 200);

    // Type with human-like delays
    for (const char of text) {
      await element.type(char, { delay: this.randomDelay(50, 150) });
    }
  }

  async humanDelay(min = 500, max = 1500) {
    const delay = this.randomDelay(min, max);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export default WalmartModule;