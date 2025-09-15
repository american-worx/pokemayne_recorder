# Target Site Module: Pokemayne Recorder

## Overview

Target's checkout process uses Shape/Imperva anti-bot detection with sophisticated cookie generation requirements. The site employs fraud detection systems and requires pre-navigation cookie setup for successful automation. This module emphasizes cookie management and Shape detection evasion.

## Site Characteristics

### URL Patterns
- **Base URL**: `https://www.target.com`
- **Product URLs**: `/p/{product-name}/-/A-{item-id}` or `/p/{item-id}`
- **Checkout URLs**: `/co-cart`, `/co-payment`, `/co-review`

### Anti-Bot Detection
- **Primary**: Shape/Imperva behavioral analysis
- **Secondary**: Custom fraud detection systems
- **Cookie Requirements**: Pre-generated session cookies required
- **Rate Limiting**: Account and IP-based restrictions

## Checkout Flow Analysis

### Phase 1: Cookie Generation and Session Setup
```javascript
// Critical: Pre-navigation cookie generation
async function generateTargetCookies() {
  // Create fresh browser context for cookie generation
  const cookieContext = await browser.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width: 1920, height: 1080 }
  });

  const cookiePage = await cookieContext.newPage();

  // Navigate to home page to establish session
  await cookiePage.goto('https://www.target.com');
  await cookiePage.waitForLoadState('networkidle');

  // Wait for Shape to initialize and generate cookies
  await cookiePage.waitForTimeout(3000);

  // Perform human-like browsing to generate realistic cookies
  await cookiePage.hover('.nav-link'); // Hover over navigation
  await cookiePage.waitForTimeout(getRandomDelay(500, 1500));

  await cookiePage.click('.nav-link'); // Click a category
  await cookiePage.waitForTimeout(getRandomDelay(1000, 2000));

  // Navigate back to home
  await cookiePage.goto('https://www.target.com');
  await cookiePage.waitForLoadState('networkidle');

  // Extract generated cookies
  const cookies = await cookieContext.cookies();

  // Close cookie generation context
  await cookieContext.close();

  return cookies;
}

// Generate cookies before main checkout
const sessionCookies = await generateTargetCookies();
```

### Phase 2: Product Verification
```javascript
// Product page selectors
const productSelectors = {
  productTitle: '[data-test="product-title"]',
  price: '[data-test="product-price"]',
  availability: '[data-test="addToCartButton"]',
  addToCartButton: '[data-test="addToCartButton"]'
};

// Apply session cookies to main context
for (const cookie of sessionCookies) {
  await context.addCookies([cookie]);
}

// Navigate to product with established session
await page.goto(productUrl);
await page.waitForSelector(productSelectors.productTitle);

// Verify product availability
const addToCartButton = await page.locator(productSelectors.addToCartButton);
const isAvailable = await addToCartButton.isEnabled();

if (!isAvailable) {
  throw new Error('Product not available for purchase');
}
```

### Phase 3: Add to Cart
```javascript
// Multiple ATC strategies for Target
const atcStrategies = [
  // Strategy 1: Direct button click
  async () => {
    await page.click(productSelectors.addToCartButton);
    await page.waitForSelector('[data-test="cart-added-modal"]', { timeout: 5000 });
  },

  // Strategy 2: API-based ATC with session cookies
  async () => {
    // Extract product data from page
    const productData = await page.evaluate(() => {
      const productId = document.querySelector('[data-test="product-id"]')?.getAttribute('data-product-id');
      const itemId = document.querySelector('[data-test="item-id"]')?.getAttribute('data-item-id');
      return { productId, itemId };
    });

    const atcPayload = {
      productId: productData.productId,
      itemId: productData.itemId,
      quantity: 1,
      storeId: '1'
    };

    await page.evaluate(async (payload) => {
      const response = await fetch('/v1/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('ATC API failed');
      }

      return response.json();
    }, atcPayload);
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
await page.goto('https://www.target.com/co-cart');
await page.waitForSelector('[data-test="cart-item"]');

// Verify item in cart
const cartItem = await page.locator('[data-test="cart-item"]').first();
await expect(cartItem).toContainText(productName);

// Proceed to checkout
await page.click('[data-test="checkout-button"]');
await page.waitForNavigation();
```

### Phase 5: Guest Checkout
```javascript
// Guest checkout option
const guestSelectors = {
  guestButton: '[data-test="guest-checkout-button"]',
  emailInput: '[data-test="email-input"]',
  continueButton: '[data-test="continue-button"]'
};

await page.click(guestSelectors.guestButton);
await page.waitForSelector(guestSelectors.emailInput);

// Fill email with human-like typing
await page.fill(guestSelectors.emailInput, customerEmail);
await page.click(guestSelectors.continueButton);
```

### Phase 6: Shipping Information
```javascript
// Shipping form with Target-specific selectors
const shippingSelectors = {
  firstName: '[data-test="first-name-input"]',
  lastName: '[data-test="last-name-input"]',
  address1: '[data-test="address1-input"]',
  address2: '[data-test="address2-input"]',
  city: '[data-test="city-input"]',
  state: '[data-test="state-dropdown"]',
  zipCode: '[data-test="zip-code-input"]',
  phone: '[data-test="phone-input"]'
};

// Fill shipping form
for (const [field, selector] of Object.entries(shippingSelectors)) {
  if (shippingData[field]) {
    await page.fill(selector, shippingData[field]);
    await page.waitForTimeout(getRandomDelay(200, 500));
  }
}

await page.click('[data-test="shipping-continue"]');
```

### Phase 7: Payment Information
```javascript
// Payment form with Target's iframe handling
const paymentSelectors = {
  cardNumber: '[data-test="card-number-input"]',
  expiryMonth: '[data-test="expiry-month-dropdown"]',
  expiryYear: '[data-test="expiry-year-dropdown"]',
  cvv: '[data-test="cvv-input"]',
  cardholderName: '[data-test="cardholder-name-input"]'
};

// Handle card number in iframe
const cardFrame = page.frameLocator('[data-test="card-number-iframe"]');
await cardFrame.locator('input').fill(cardData.number);

// Fill other payment fields
await page.selectOption(paymentSelectors.expiryMonth, cardData.expiryMonth);
await page.selectOption(paymentSelectors.expiryYear, cardData.expiryYear);
await page.fill(paymentSelectors.cvv, cardData.cvv);
await page.fill(paymentSelectors.cardholderName, cardData.name);
```

### Phase 8: Fraud Detection and Order Submission
```javascript
// Handle fraud detection challenges
async function handleFraudDetection() {
  // Check for Shape challenge
  if (await page.locator('.shape-challenge').isVisible()) {
    console.log('Shape challenge detected');

    // Wait for challenge to complete
    await page.waitForSelector('.shape-challenge', { state: 'hidden', timeout: 30000 });

    // Verify challenge passed
    if (await page.locator('.shape-challenge').isVisible()) {
      throw new Error('Shape challenge failed');
    }
  }

  // Check for additional verification
  if (await page.locator('[data-test="verification-required"]').isVisible()) {
    console.log('Additional verification required');

    // Handle verification (may require manual intervention)
    await page.waitForSelector('[data-test="verification-complete"]', { timeout: 60000 });
  }
}

// Handle fraud detection before submission
await handleFraudDetection();

// Submit order
await page.click('[data-test="placeOrderButton"]');

// Wait for confirmation or error
await Promise.race([
  page.waitForSelector('[data-test="order-confirmation"]'),
  page.waitForSelector('[data-test="order-error"]'),
  page.waitForTimeout(30000)
]);

// Verify success
if (await page.locator('[data-test="order-confirmation"]').isVisible()) {
  const orderNumber = await page.locator('[data-test="order-number"]').textContent();
  console.log(`Order completed: ${orderNumber}`);
} else {
  throw new Error('Order submission failed');
}
```

## API Endpoints

### Cart Management
```javascript
// Add to cart API
const cartPayload = {
  productId: productId,
  itemId: itemId,
  quantity: 1,
  storeId: '1',
  fulfillmentMethod: 'SHIP'
};

const cartResponse = await fetch('/v1/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
    'Cookie': sessionCookies.map(c => `${c.name}=${c.value}`).join('; ')
  },
  body: JSON.stringify(cartPayload)
});
```

### Session Validation
```javascript
// Validate session before checkout
const sessionResponse = await fetch('/v1/session/validate', {
  method: 'GET',
  headers: {
    'Cookie': sessionCookies.map(c => `${c.name}=${c.value}`).join('; ')
  }
});

const sessionData = await sessionResponse.json();
if (!sessionData.valid) {
  throw new Error('Session validation failed');
}
```

## Error Handling

### Common Error Scenarios
```javascript
// Order canceled due to policy
if (await page.locator('[data-test="order-canceled"]').isVisible()) {
  const errorText = await page.locator('[data-test="order-canceled"]').textContent();
  if (errorText.includes('Item Demand')) {
    throw new Error('Order canceled due to item demand policy');
  }
}

// Fraud detection triggered
if (await page.locator('.fraud-detection').isVisible()) {
  throw new Error('Fraud detection triggered');
}

// Shape challenge failed
if (await page.locator('.shape-failed').isVisible()) {
  throw new Error('Shape challenge failed');
}

// Session expired
if (await page.locator('[data-test="session-expired"]').isVisible()) {
  throw new Error('Session expired during checkout');
}
```

### Recovery Strategies
```javascript
const recoveryStrategies = {
  orderCanceledDemand: async () => {
    // Generate new cookies and retry
    const newCookies = await generateTargetCookies();
    await context.clearCookies();
    for (const cookie of newCookies) {
      await context.addCookies([cookie]);
    }
    return true;
  },

  fraudDetected: async () => {
    // Wait and retry with different timing
    await page.waitForTimeout(30000); // 30 second cooldown
    return true;
  },

  shapeFailed: async () => {
    // Generate fresh cookies and restart
    const freshCookies = await generateTargetCookies();
    await context.clearCookies();
    for (const cookie of freshCookies) {
      await context.addCookies([freshCookies]);
    }
    return true;
  },

  sessionExpired: async () => {
    // Regenerate session and restart checkout
    const newSession = await generateTargetCookies();
    await page.reload();
    return true;
  }
};
```

## Stealth Requirements

### Browser Configuration
```javascript
// Target-specific stealth settings
const targetStealthConfig = {
  userAgent: getRandomUserAgent(),
  viewport: { width: 1920, height: 1080 },
  timezone: 'America/New_York',
  locale: 'en-US',

  // Cookie management is critical
  httpCredentials: null, // No HTTP auth

  // Realistic browser features
  plugins: [
    { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', description: '' }
  ],

  languages: ['en-US', 'en'],

  // Shape-specific evasions
  extraHTTPHeaders: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive'
  }
};
```

### Behavioral Patterns
```javascript
// Target-specific human behavior (Shape-aware)
const targetBehaviorPatterns = {
  pageLoadDelay: () => Math.random() * 3000 + 2000, // 2-5 seconds
  interactionDelay: () => Math.random() * 1200 + 600,  // 0.6-1.8 seconds
  typingSpeed: () => Math.random() * 180 + 120,        // 120-300ms per character

  mouseMovement: {
    speed: () => Math.random() * 450 + 250,  // pixels per second
    curvature: () => Math.random() * 0.4 + 0.1  // bezier curve factor
  },

  scrollBehavior: {
    speed: () => Math.random() * 900 + 500,  // pixels per second
    pauseFrequency: 0.35  // pause every 35% of scroll distance
  },

  // Cookie generation specific
  cookieGenDelay: () => Math.random() * 2000 + 1000, // 1-3 seconds between actions
  sessionWarmupTime: 3000 // 3 seconds for Shape initialization
};
```

## Cookie Management System

### Advanced Cookie Generation
```javascript
class TargetCookieManager {
  constructor(browser) {
    this.browser = browser;
    this.cookieCache = new Map();
  }

  async generateFreshCookies() {
    const context = await this.browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
      // Navigate to establish session
      await page.goto('https://www.target.com');
      await page.waitForLoadState('networkidle');

      // Warm up session with human-like behavior
      await this.warmupSession(page);

      // Extract all cookies
      const cookies = await context.cookies();

      // Cache cookies with timestamp
      const cookieKey = `target_${Date.now()}`;
      this.cookieCache.set(cookieKey, {
        cookies,
        timestamp: Date.now(),
        userAgent: await page.evaluate(() => navigator.userAgent)
      });

      return cookies;

    } finally {
      await context.close();
    }
  }

  async warmupSession(page) {
    // Simulate human browsing to generate realistic cookies
    const actions = [
      () => page.hover('.nav-link'),
      () => page.click('.nav-link'),
      () => page.waitForTimeout(getRandomDelay(1000, 2000)),
      () => page.goto('https://www.target.com'),
      () => page.hover('[data-test="search-input"]'),
      () => page.type('[data-test="search-input"]', 'test', { delay: 200 }),
      () => page.keyboard.press('Backspace'),
      () => page.keyboard.press('Backspace'),
      () => page.keyboard.press('Backspace'),
      () => page.keyboard.press('Backspace')
    ];

    for (const action of actions) {
      await action();
      await page.waitForTimeout(getRandomDelay(500, 1500));
    }
  }

  async getValidCookies() {
    // Return cached cookies if still valid (< 5 minutes)
    for (const [key, data] of this.cookieCache.entries()) {
      if (Date.now() - data.timestamp < 300000) { // 5 minutes
        return data.cookies;
      } else {
        this.cookieCache.delete(key);
      }
    }

    // Generate new cookies if none valid
    return await this.generateFreshCookies();
  }
}
```

## Monitoring and Metrics

### Success Indicators
```javascript
const successMetrics = {
  checkoutComplete: await page.url().includes('/order-confirmation'),
  orderNumberPresent: await page.locator('[data-test="order-number"]').isVisible(),
  noFraudFlags: !(await page.locator('.fraud-detection').isVisible()),
  noShapeChallenges: !(await page.locator('.shape-challenge').isVisible()),

  performance: {
    totalTime: Date.now() - startTime,
    cookieGenerationTime: cookieGenTime,
    sessionWarmupTime: warmupTime,
    retriesNeeded: retryCount
  }
};
```

### Failure Detection
```javascript
const failurePatterns = [
  // Shape/Imperva related
  '.shape-challenge',
  '.imperva-challenge',
  '.behavior-analysis',

  // Fraud detection
  '.fraud-detection',
  '[data-test="verification-required"]',
  '.suspicious-activity',

  // Policy violations
  '[data-test="order-canceled"]',
  '.policy-violation',
  '.item-demand-block',

  // Technical errors
  '[data-test="session-expired"]',
  '.server-error',
  '.timeout-error'
];
```

## Testing Strategy

### Unit Tests
```javascript
describe('Target Checkout Module', () => {
  test('should generate valid cookies', async () => {
    const cookieManager = new TargetCookieManager(browser);
    const cookies = await cookieManager.generateFreshCookies();
    expect(cookies.length).toBeGreaterThan(0);
  });

  test('should handle Shape challenges', async () => {
    const module = new TargetModule();
    const result = await module.handleShapeChallenge(page);
    expect(result).toBe(true);
  });
});
```

### Integration Tests
```javascript
describe('Target Full Checkout Flow', () => {
  test('should complete checkout with cookie generation', async () => {
    const module = new TargetModule();
    const result = await module.executeCheckout(page, testConfig);

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBeDefined();
    expect(result.cookiesGenerated).toBe(true);
  });
});
```

### E2E Tests
```javascript
// Full browser test with cookie generation
test('Target E2E Checkout', async ({ browser }) => {
  const cookieManager = new TargetCookieManager(browser);
  const cookies = await cookieManager.generateFreshCookies();

  const context = await browser.newContext(targetStealthConfig);
  await context.addCookies(cookies);

  const page = await context.newPage();

  // Complete checkout flow
  await page.goto('https://www.target.com/p/test-product/-/A-12345');
  // ... full test implementation
});
```

## Configuration Template

### YAML Configuration
```yaml
site: target
product:
  url: "https://www.target.com/p/test-product/-/A-12345678"
  product_id: "12345678"
  item_id: "98765432"

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
  timeout: 45000
  cookie_refresh_interval: 300000
  shape_detection_enabled: true
```

## Maintenance Notes

### Cookie Strategy Updates
- Monitor Shape/Imperva updates that may change cookie requirements
- Track session validation patterns and update accordingly
- Maintain multiple cookie generation strategies for reliability

### Fraud Detection Updates
- Track Target's fraud detection algorithm changes
- Monitor for new verification requirements
- Update behavioral patterns to match current detection thresholds

### Performance Optimization
- Optimize cookie generation and validation workflows
- Cache valid cookie sessions when possible
- Implement parallel cookie generation for high-volume usage

### Legal Compliance
- Respect Target's Terms of Service
- Avoid excessive account creation or session generation
- Implement proper session cleanup and rotation
- Focus on legitimate automation use cases
