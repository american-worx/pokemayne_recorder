# BestBuy Site Module: Pokemayne Recorder

## Overview

BestBuy's checkout process uses GraphQL APIs for inventory management and implements timed wave releases for high-demand products. The site employs sophisticated queue systems and real-time stock monitoring. This module emphasizes GraphQL integration, wave monitoring, and fast-track checkout optimization.

## Site Characteristics

### URL Patterns
- **Base URL**: `https://www.bestbuy.com`
- **Product URLs**: `/site/{product-name}/{sku}.p`
- **Checkout URLs**: `/cart`, `/checkout`, `/checkout/r/fast-track`

### Anti-Bot Detection
- **Primary**: Queue systems and rate limiting
- **Secondary**: Real-time inventory monitoring
- **GraphQL**: API-based stock checking
- **Wave System**: Timed product releases

## Checkout Flow Analysis

### Phase 1: Product Verification and Wave Monitoring
```javascript
// GraphQL inventory checking
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
        pickup {
          available
          locations {
            name
            distance
          }
        }
      }
      price {
        currentPrice
        originalPrice
      }
      condition
    }
  }
`;

async function checkProductAvailability(sku) {
  const response = await fetch('https://www.bestbuy.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': getRandomUserAgent()
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
  return {
    available: data.data.product.availability.available,
    inStore: data.data.product.availability.inStore,
    online: data.data.product.availability.online,
    shipping: data.data.product.availability.shipping,
    price: data.data.product.price.currentPrice
  };
}

// Wave monitoring system
class WaveMonitor {
  constructor(sku, checkInterval = 5000) { // 5 second checks
    this.sku = sku;
    this.checkInterval = checkInterval;
    this.isMonitoring = false;
    this.onStockCallback = null;
  }

  async startMonitoring() {
    this.isMonitoring = true;
    console.log(`Starting wave monitoring for SKU: ${this.sku}`);

    while (this.isMonitoring) {
      try {
        const availability = await checkProductAvailability(this.sku);

        if (availability.available && availability.online) {
          console.log(`Product ${this.sku} is now available!`);
          if (this.onStockCallback) {
            this.onStockCallback(availability);
          }
          break;
        }

        // Random delay to avoid detection
        const delay = this.checkInterval + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        console.log(`Monitoring error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second backoff
      }
    }
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }

  onStock(callback) {
    this.onStockCallback = callback;
  }
}

// Usage
const monitor = new WaveMonitor(sku);
monitor.onStock(async (availability) => {
  console.log('Product is in stock! Starting checkout...');
  await executeCheckout(availability);
});
await monitor.startMonitoring();
```

### Phase 2: Product Page Navigation
```javascript
// Product page selectors
const productSelectors = {
  productTitle: '.sku-title',
  price: '.priceView-customer-price span',
  addToCartButton: '.add-to-cart-button',
  availabilityStatus: '.availability-status',
  skuValue: '[data-automation="sku"]'
};

// Navigate to product with availability check
await page.goto(productUrl);
await page.waitForSelector(productSelectors.productTitle);

// Extract SKU from page
const sku = await page.locator(productSelectors.skuValue).getAttribute('data-automation');

// Verify availability via GraphQL
const availability = await checkProductAvailability(sku);
if (!availability.available || !availability.online) {
  throw new Error('Product not available for online purchase');
}

// Check for queue system
const queuePresent = await page.locator('.queue-container').isVisible();
if (queuePresent) {
  console.log('Queue system detected, waiting...');
  await handleQueueSystem(page);
}
```

### Phase 3: Add to Cart
```javascript
// Multiple ATC strategies for BestBuy
const atcStrategies = [
  // Strategy 1: Direct button click
  async () => {
    await page.click(productSelectors.addToCartButton);
    await page.waitForSelector('.added-to-cart', { timeout: 5000 });
  },

  // Strategy 2: GraphQL ATC
  async () => {
    const addToCartMutation = `
      mutation AddToCart($sku: String!, $quantity: Int!) {
        addToCart(sku: $sku, quantity: $quantity) {
          success
          cart {
            id
            items {
              sku
              quantity
            }
          }
          errors {
            message
          }
        }
      }
    `;

    const response = await fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': await getCsrfToken(page)
      },
      body: JSON.stringify({
        query: addToCartMutation,
        variables: { sku, quantity: 1 }
      })
    });

    const data = await response.json();
    if (!data.data.addToCart.success) {
      throw new Error('GraphQL ATC failed');
    }
  }
];

// Try strategies with fallback
for (const strategy of atcStrategies) {
  try {
    await strategy();
    break;
  } catch (error) {
    console.log(`ATC strategy failed: ${error.message}`);
    continue;
  }
}
```

### Phase 4: Cart Navigation
```javascript
// Navigate to cart with verification
await page.goto('https://www.bestbuy.com/cart');
await page.waitForSelector('.cart-item');

// Verify item in cart
const cartItem = await page.locator('.cart-item').first();
await expect(cartItem).toContainText(productName);

// Check for fast-track eligibility
const fastTrackEligible = await page.locator('.fast-track-button').isVisible();
if (fastTrackEligible) {
  console.log('Fast-track checkout available');
  await page.click('.fast-track-button');
} else {
  await page.click('.checkout-button');
}
```

### Phase 5: Guest Checkout
```javascript
// Guest checkout option
const guestSelectors = {
  guestButton: '.guest-checkout-btn',
  emailInput: '#user-email',
  continueButton: '.continue-button'
};

await page.click(guestSelectors.guestButton);
await page.waitForSelector(guestSelectors.emailInput);

// Fill email with human-like typing
await page.fill(guestSelectors.emailInput, customerEmail);
await page.click(guestSelectors.continueButton);
```

### Phase 6: Shipping Information
```javascript
// Shipping form with BestBuy-specific selectors
const shippingSelectors = {
  firstName: '#first-name',
  lastName: '#last-name',
  address1: '#street-address',
  address2: '#street-address-2',
  city: '#city',
  state: '#state',
  zipCode: '#zipcode',
  phone: '#phone-number'
};

// Fill shipping form
for (const [field, selector] of Object.entries(shippingSelectors)) {
  if (shippingData[field]) {
    await page.fill(selector, shippingData[field]);
    await page.waitForTimeout(getRandomDelay(150, 400));
  }
}

await page.click('.continue-to-payment');
```

### Phase 7: Payment Information
```javascript
// Payment form with BestBuy's iframe handling
const paymentSelectors = {
  cardNumber: '#card-number',
  expiryMonth: '#expiration-month',
  expiryYear: '#expiration-year',
  cvv: '#cvv',
  cardholderName: '#cardholder-name'
};

// Handle card number in iframe
const cardFrame = page.frameLocator('.card-number-iframe');
await cardFrame.locator('input').fill(cardData.number);

// Fill other payment fields
await page.selectOption(paymentSelectors.expiryMonth, cardData.expiryMonth);
await page.selectOption(paymentSelectors.expiryYear, cardData.expiryYear);
await page.fill(paymentSelectors.cvv, cardData.cvv);
await page.fill(paymentSelectors.cardholderName, cardData.name);
```

### Phase 8: CAPTCHA and Order Submission
```javascript
// Handle CAPTCHA if present
async function handleBestBuyCaptcha() {
  const captchaSelectors = [
    '.g-recaptcha',
    '.h-captcha',
    '[data-testid="captcha-container"]'
  ];

  for (const selector of captchaSelectors) {
    if (await page.locator(selector).isVisible()) {
      console.log('CAPTCHA detected, solving...');

      // Use 2Captcha or similar service
      const captchaSolution = await solveCaptchaWithService(page, selector);

      // Apply solution
      await page.evaluate((solution) => {
        const captchaInput = document.querySelector('input[name="g-recaptcha-response"]');
        if (captchaInput) {
          captchaInput.value = solution;
        }
      }, captchaSolution);

      break;
    }
  }
}

// Handle CAPTCHA before submission
await handleBestBuyCaptcha();

// Submit order
await page.click('.place-order-button');

// Wait for confirmation
await Promise.race([
  page.waitForSelector('.order-confirmation'),
  page.waitForSelector('.order-error'),
  page.waitForTimeout(30000)
]);

// Verify success
if (await page.locator('.order-confirmation').isVisible()) {
  const orderNumber = await page.locator('.order-number').textContent();
  console.log(`Order completed: ${orderNumber}`);
} else {
  throw new Error('Order submission failed');
}
```

## GraphQL API Integration

### Inventory Monitoring
```javascript
// Real-time inventory monitoring
const inventorySubscription = `
  subscription ProductInventory($sku: String!) {
    productInventory(sku: $sku) {
      sku
      availability {
        available
        online
        inStore
        shipping
      }
      lastUpdated
    }
  }
`;

// WebSocket connection for real-time updates
class GraphQLSubscriptionManager {
  constructor() {
    this.ws = null;
    this.subscriptions = new Map();
  }

  async connect() {
    this.ws = new WebSocket('wss://www.bestbuy.com/graphql-ws');

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'data') {
        const callback = this.subscriptions.get(data.id);
        if (callback) {
          callback(data.payload);
        }
      }
    };
  }

  async subscribe(query, variables, callback) {
    const id = Math.random().toString(36);
    this.subscriptions.set(id, callback);

    this.ws.send(JSON.stringify({
      type: 'start',
      id,
      payload: { query, variables }
    }));

    return id;
  }

  unsubscribe(id) {
    this.subscriptions.delete(id);
    this.ws.send(JSON.stringify({
      type: 'stop',
      id
    }));
  }
}
```

### Cart Management
```javascript
// GraphQL cart operations
const cartQueries = {
  getCart: `
    query GetCart {
      cart {
        id
        items {
          sku
          name
          quantity
          price
        }
        total
      }
    }
  `,

  updateCartItem: `
    mutation UpdateCartItem($sku: String!, $quantity: Int!) {
      updateCartItem(sku: $sku, quantity: $quantity) {
        success
        cart {
          id
          items {
            sku
            quantity
          }
        }
        errors {
          message
        }
      }
    }
  `,

  removeCartItem: `
    mutation RemoveCartItem($sku: String!) {
      removeCartItem(sku: $sku) {
        success
        cart {
          id
          items {
            sku
            quantity
          }
        }
      }
    }
  `
};
```

## Error Handling

### Common Error Scenarios
```javascript
// Queue system active
if (await page.locator('.queue-container').isVisible()) {
  throw new Error('Product is in queue system');
}

// Out of stock during checkout
if (await page.locator('.out-of-stock').isVisible()) {
  throw new Error('Product went out of stock');
}

// Payment declined
if (await page.locator('.payment-error').isVisible()) {
  const errorMsg = await page.locator('.payment-error').textContent();
  throw new Error(`Payment failed: ${errorMsg}`);
}

// CAPTCHA failed
if (await page.locator('.captcha-error').isVisible()) {
  throw new Error('CAPTCHA solving failed');
}
```

### Recovery Strategies
```javascript
const recoveryStrategies = {
  queueActive: async () => {
    // Wait for queue to clear or find alternative
    console.log('Waiting for queue to clear...');
    await page.waitForSelector('.queue-container', { state: 'hidden', timeout: 300000 }); // 5 min timeout
    return true;
  },

  outOfStock: async () => {
    // Monitor for restock
    const monitor = new WaveMonitor(sku);
    return new Promise((resolve) => {
      monitor.onStock(() => {
        monitor.stopMonitoring();
        resolve(true);
      });
      monitor.startMonitoring();
    });
  },

  captchaFailed: async () => {
    // Retry with different CAPTCHA service
    await handleBestBuyCaptcha();
    return true;
  },

  sessionExpired: async () => {
    // Restart checkout process
    await page.reload();
    await navigateToProduct();
    return true;
  }
};
```

## Stealth Requirements

### Browser Configuration
```javascript
// BestBuy-specific stealth settings
const bestbuyStealthConfig = {
  userAgent: getRandomUserAgent(),
  viewport: { width: 1920, height: 1080 },
  timezone: 'America/New_York',
  locale: 'en-US',

  // GraphQL-specific headers
  extraHTTPHeaders: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },

  // Realistic browser features
  plugins: [
    { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', description: '' }
  ],

  languages: ['en-US', 'en']
};
```

### Behavioral Patterns
```javascript
// BestBuy-specific human behavior (queue-aware)
const bestbuyBehaviorPatterns = {
  pageLoadDelay: () => Math.random() * 2500 + 1500, // 1.5-4 seconds
  interactionDelay: () => Math.random() * 1000 + 400,  // 0.4-1.4 seconds
  typingSpeed: () => Math.random() * 160 + 100,        // 100-260ms per character

  mouseMovement: {
    speed: () => Math.random() * 500 + 300,  // pixels per second
    curvature: () => Math.random() * 0.3 + 0.1  // bezier curve factor
  },

  scrollBehavior: {
    speed: () => Math.random() * 1000 + 600,  // pixels per second
    pauseFrequency: 0.3  // pause every 30% of scroll distance
  },

  // Wave monitoring specific
  waveCheckInterval: () => Math.random() * 3000 + 2000, // 2-5 seconds between checks
  queueWaitTimeout: 300000 // 5 minutes max queue wait
};
```

## Wave Monitoring System

### Advanced Wave Detection
```javascript
class BestBuyWaveMonitor {
  constructor(sku) {
    this.sku = sku;
    this.monitoring = false;
    this.lastAvailability = null;
    this.waveCallbacks = [];
  }

  async startWaveMonitoring() {
    this.monitoring = true;
    console.log(`Starting wave monitoring for SKU: ${this.sku}`);

    while (this.monitoring) {
      try {
        const availability = await this.checkAvailability();

        // Detect wave release
        if (this.lastAvailability && !this.lastAvailability.available && availability.available) {
          console.log(`Wave released for SKU: ${this.sku}!`);
          this.triggerWaveCallbacks(availability);
          break;
        }

        this.lastAvailability = availability;

        // Random delay between checks
        const delay = Math.random() * 3000 + 2000; // 2-5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        console.error(`Wave monitoring error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  async checkAvailability() {
    // Use GraphQL for availability check
    const response = await fetch('https://www.bestbuy.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': getRandomUserAgent()
      },
      body: JSON.stringify({
        query: inventoryQuery,
        variables: { sku: this.sku }
      })
    });

    const data = await response.json();
    return data.data.product.availability;
  }

  onWaveRelease(callback) {
    this.waveCallbacks.push(callback);
  }

  triggerWaveCallbacks(availability) {
    this.waveCallbacks.forEach(callback => callback(availability));
  }

  stopMonitoring() {
    this.monitoring = false;
  }
}
```

## Monitoring and Metrics

### Success Indicators
```javascript
const successMetrics = {
  checkoutComplete: await page.url().includes('/order-confirmation'),
  orderNumberPresent: await page.locator('.order-number').isVisible(),
  waveDetected: waveWasDetected,
  fastTrackUsed: fastTrackEligible && fastTrackUsed,

  performance: {
    totalTime: Date.now() - startTime,
    waveWaitTime: waveDetectionTime - startTime,
    queueWaitTime: queueWaitDuration,
    graphqlCalls: graphqlCallCount
  }
};
```

### Failure Detection
```javascript
const failurePatterns = [
  // Queue related
  '.queue-container',
  '.waiting-in-queue',
  '.queue-timeout',

  // Stock related
  '.out-of-stock',
  '.sold-out',
  '.coming-soon',

  // Technical errors
  '.server-error',
  '.graphql-error',
  '.network-error',

  // Payment errors
  '.payment-declined',
  '.card-error',
  '.billing-error'
];
```

## Testing Strategy

### Unit Tests
```javascript
describe('BestBuy Checkout Module', () => {
  test('should monitor product waves', async () => {
    const monitor = new BestBuyWaveMonitor('12345678');
    const availability = await monitor.checkAvailability();
    expect(availability).toBeDefined();
  });

  test('should handle GraphQL queries', async () => {
    const module = new BestBuyModule();
    const result = await module.queryInventory('12345678');
    expect(result.available).toBeDefined();
  });
});
```

### Integration Tests
```javascript
describe('BestBuy Full Checkout Flow', () => {
  test('should complete checkout with wave monitoring', async () => {
    const module = new BestBuyModule();
    const result = await module.executeCheckout(page, testConfig);

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBeDefined();
    expect(result.waveDetected).toBe(true);
  });
});
```

### E2E Tests
```javascript
// Full browser test with wave monitoring
test('BestBuy E2E Checkout', async ({ browser }) => {
  const monitor = new BestBuyWaveMonitor('12345678');

  monitor.onWaveRelease(async (availability) => {
    const context = await browser.newContext(bestbuyStealthConfig);
    const page = await context.newPage();

    // Complete checkout flow
    await page.goto('https://www.bestbuy.com/site/test-product/12345678.p');
    // ... full test implementation
  });

  await monitor.startWaveMonitoring();
});
```

## Configuration Template

### YAML Configuration
```yaml
site: bestbuy
product:
  url: "https://www.bestbuy.com/site/test-product/12345678.p"
  sku: "12345678"

customer:
  email: "customer@example.com"
  shipping:
    first_name: "John"
    last_name: "Doe"
    address1: "123 Main St"
    city: "Anytown"
    state: "CA"
    zip_code: "12345"
    phone: "555-123-4567"

payment:
  card_number: "4111111111111111"
  expiry_month: "12"
  expiry_year: "2025"
  cvv: "123"
  cardholder_name: "John Doe"

options:
  stealth_level: "high"
  max_retries: 3
  timeout: 30000
  wave_monitoring_enabled: true
  fast_track_enabled: true
  graphql_timeout: 5000
```

## Maintenance Notes

### GraphQL Updates
- Monitor BestBuy's GraphQL schema changes
- Track new inventory query patterns
- Update subscription handling as needed

### Wave System Updates
- Track changes in wave release patterns
- Monitor queue system modifications
- Update monitoring intervals based on performance

### Performance Optimization
- Optimize GraphQL query batching
- Cache inventory data when appropriate
- Implement efficient wave monitoring algorithms

### Legal Compliance
- Respect BestBuy's Terms of Service
- Avoid excessive API calls that could be detected
- Implement proper rate limiting for GraphQL queries
- Focus on legitimate automation use cases
