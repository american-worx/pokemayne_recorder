# Walmart Site Module: Pokemayne Recorder

## Overview

Walmart's checkout process is heavily protected with CAPTCHA challenges and Akamai Bot Manager fingerprinting. The site uses residential proxy rotation extensively and has sophisticated demand detection systems. This module emphasizes CAPTCHA solving integration and rapid proxy rotation for high-demand scenarios.

## Site Characteristics

### URL Patterns
- **Base URL**: `https://www.walmart.com`
- **Product URLs**: `/ip/{product-name}/{item-id}` or `/ip/{item-id}`
- **Checkout URLs**: `/checkout`, `/cart`

### Anti-Bot Detection
- **Primary**: CAPTCHA (reCAPTCHA, hCaptcha) on checkout submission
- **Secondary**: Akamai Bot Manager with fingerprinting
- **Rate Limiting**: IP-based with behavioral analysis
- **Demand Detection**: "Item Demand" flags for high-demand items

## Checkout Flow Analysis

### Phase 1: Product Verification
```javascript
// Product page verification with API check
const productSelectors = {
  productTitle: '.prod-ProductTitle',
  price: '.prod-PriceSection .price-characteristic',
  availability: '.prod-ProductCTA .prod-ProductCTAButton',
  addToCartButton: '#add-to-cart-btn'
};

// Verify product availability via API
async function verifyProductAvailability(sku) {
  const response = await fetch(`/api/inventory/${sku}`, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Product verification failed');
  }

  const data = await response.json();
  return {
    available: data.available,
    quantity: data.quantity,
    shippable: data.shippable
  };
}

// Check product page load
await page.goto(productUrl);
await page.waitForSelector(productSelectors.productTitle);

// Verify stock via API
const availability = await verifyProductAvailability(sku);
if (!availability.available) {
  throw new Error('Product out of stock');
}
```

### Phase 2: Add to Cart
```javascript
// Multiple ATC strategies for reliability
const atcStrategies = [
  // Strategy 1: Direct button click
  async () => {
    await page.click(productSelectors.addToCartButton);
    await page.waitForSelector('.cart-popup', { timeout: 5000 });
  },

  // Strategy 2: API-based ATC
  async () => {
    const atcPayload = {
      sku: sku,
      quantity: 1,
      storeId: '1', // Default store
      shippable: true
    };

    await page.evaluate(async (payload) => {
      const response = await fetch('/api/cart/add', {
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

### Phase 3: Cart and Checkout Navigation
```javascript
// Navigate to cart with verification
await page.goto('https://www.walmart.com/cart');
await page.waitForSelector('.cart-list');

// Verify item in cart
const cartItem = await page.locator('.cart-item').first();
await expect(cartItem).toContainText(productName);

// Proceed to checkout
await page.click('#checkout-button');
await page.waitForNavigation();
```

### Phase 4: Guest Checkout Setup
```javascript
// Guest checkout option
const guestCheckoutSelectors = {
  guestButton: '[data-testid="guest-checkout-btn"]',
  emailInput: '#email',
  continueButton: '[data-testid="continue-guest"]'
};

await page.click(guestCheckoutSelectors.guestButton);
await page.waitForSelector(guestCheckoutSelectors.emailInput);

// Fill email with human-like typing
await page.fill(guestCheckoutSelectors.emailInput, customerEmail);
await page.click(guestCheckoutSelectors.continueButton);
```

### Phase 5: Shipping Information
```javascript
// Shipping form with Walmart-specific selectors
const shippingSelectors = {
  firstName: '#firstName',
  lastName: '#lastName',
  address1: '#addressLineOne',
  address2: '#addressLineTwo',
  city: '#city',
  state: '#state',
  zipCode: '#postalCode',
  phone: '#phone'
};

// Fill shipping form
for (const [field, selector] of Object.entries(shippingSelectors)) {
  if (shippingData[field]) {
    await page.fill(selector, shippingData[field]);
    await page.waitForTimeout(getRandomDelay(100, 300));
  }
}

await page.click('[data-testid="shipping-continue"]');
```

### Phase 6: Payment Information
```javascript
// Payment form with iframe handling
const paymentSelectors = {
  cardNumber: '#creditCardNumber',
  expiryMonth: '#expirationDateMonth',
  expiryYear: '#expirationDateYear',
  cvv: '#cvv',
  cardholderName: '#cardholderName'
};

// Handle card number in iframe if present
const cardFrame = page.frameLocator('.card-number-iframe');
if (await cardFrame.locator('input').count() > 0) {
  await cardFrame.locator('input').fill(cardData.number);
} else {
  await page.fill(paymentSelectors.cardNumber, cardData.number);
}

// Fill other payment fields
await page.selectOption(paymentSelectors.expiryMonth, cardData.expiryMonth);
await page.selectOption(paymentSelectors.expiryYear, cardData.expiryYear);
await page.fill(paymentSelectors.cvv, cardData.cvv);
await page.fill(paymentSelectors.cardholderName, cardData.name);
```

### Phase 7: CAPTCHA Handling and Order Submission
```javascript
// CAPTCHA detection and solving
async function handleCaptcha() {
  const captchaSelectors = [
    '.g-recaptcha',
    '.h-captcha',
    '[data-testid="captcha-container"]'
  ];

  for (const selector of captchaSelectors) {
    if (await page.locator(selector).isVisible()) {
      console.log('CAPTCHA detected, solving...');

      // Use 2Captcha API for solving
      const captchaSolution = await solveCaptchaWith2Captcha(page, selector);

      // Apply solution
      await page.evaluate((solution) => {
        // Apply CAPTCHA solution to form
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
await handleCaptcha();

// Submit order
await page.click('#checkout-submit-btn');

// Wait for confirmation or error
await Promise.race([
  page.waitForSelector('.order-confirmation'),
  page.waitForSelector('.error-message'),
  page.waitForTimeout(30000) // 30 second timeout
]);

// Verify success
if (await page.locator('.order-confirmation').isVisible()) {
  const orderNumber = await page.locator('.order-number').textContent();
  console.log(`Order completed: ${orderNumber}`);
} else {
  throw new Error('Order submission failed');
}
```

## API Endpoints

### Inventory Check
```javascript
// Real-time inventory verification
const inventoryPayload = {
  sku: sku,
  storeId: '1',
  fulfillmentMethod: 'SHIP'
};

const inventoryResponse = await fetch('/api/inventory/availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(inventoryPayload)
});

const inventoryData = await inventoryResponse.json();
```

### Cart Management
```javascript
// Add to cart API
const cartPayload = {
  sku: sku,
  quantity: 1,
  storeId: '1',
  shippable: true,
  offerId: offerId // From product data
};

const cartResponse = await fetch('/api/cart/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(cartPayload)
});
```

## Error Handling

### Common Error Scenarios
```javascript
// Item demand detection
if (await page.locator('[data-testid="item-demand"]').isVisible()) {
  throw new Error('Item in high demand - requires proxy rotation');
}

// CAPTCHA failure
if (await page.locator('.captcha-error').isVisible()) {
  throw new Error('CAPTCHA solving failed');
}

// Out of stock
if (await page.locator('.out-of-stock').isVisible()) {
  throw new Error('Product went out of stock during checkout');
}

// Payment declined
if (await page.locator('.payment-error').isVisible()) {
  const errorMsg = await page.locator('.payment-error').textContent();
  throw new Error(`Payment failed: ${errorMsg}`);
}
```

### Recovery Strategies
```javascript
const recoveryStrategies = {
  itemDemand: async () => {
    // Rotate to new residential proxy
    const newProxy = await proxyManager.getNextResidentialProxy();
    await context.setProxy(newProxy);
    return true;
  },

  captchaFailed: async () => {
    // Retry with different CAPTCHA solving service
    await handleCaptchaWithAlternativeService();
    return true;
  },

  outOfStock: async () => {
    // Monitor for restock and retry
    await monitorProductRestock(sku);
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
// Walmart-specific stealth settings
const walmartStealthConfig = {
  userAgent: getRandomUserAgent(), // Heavy rotation needed
  viewport: {
    width: Math.floor(1280 + Math.random() * 640),
    height: Math.floor(720 + Math.random() * 360)
  },
  timezone: 'America/New_York',
  locale: 'en-US',

  // Residential proxy required
  proxy: {
    server: residentialProxyServer,
    username: proxyUsername,
    password: proxyPassword
  },

  // Realistic browser features
  plugins: [
    { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', description: '' },
    { name: 'Native Client', description: '' }
  ],

  languages: ['en-US', 'en']
};
```

### Behavioral Patterns
```javascript
// Walmart-specific human behavior (slower due to CAPTCHA)
const walmartBehaviorPatterns = {
  pageLoadDelay: () => Math.random() * 4000 + 3000, // 3-7 seconds
  interactionDelay: () => Math.random() * 1500 + 800,  // 0.8-2.3 seconds
  typingSpeed: () => Math.random() * 200 + 150,        // 150-350ms per character

  mouseMovement: {
    speed: () => Math.random() * 400 + 200,  // pixels per second
    curvature: () => Math.random() * 0.6 + 0.2  // bezier curve factor
  },

  scrollBehavior: {
    speed: () => Math.random() * 800 + 400,  // pixels per second
    pauseFrequency: 0.4  // pause every 40% of scroll distance
  }
};
```

## Monitoring and Metrics

### Success Indicators
```javascript
const successMetrics = {
  checkoutComplete: await page.url().includes('/order-confirmation'),
  orderNumberPresent: await page.locator('.order-number').isVisible(),
  noCaptchaErrors: !(await page.locator('.captcha-error').isVisible()),
  noDemandFlags: !(await page.locator('[data-testid="item-demand"]').isVisible()),

  performance: {
    totalTime: Date.now() - startTime,
    captchaSolves: captchaSolveCount,
    proxyRotations: proxyRotationCount,
    retriesNeeded: retryCount
  }
};
```

### Failure Detection
```javascript
const failurePatterns = [
  // CAPTCHA related
  '.g-recaptcha',
  '.h-captcha',
  '.captcha-error',
  '[data-testid="captcha-container"]',

  // Demand detection
  '[data-testid="item-demand"]',
  '.high-demand-message',
  '.queue-required',

  // Business logic errors
  '.out-of-stock',
  '.payment-declined',
  '.shipping-unavailable',

  // Technical errors
  '.server-error',
  '.timeout-error',
  '.akamai-challenge'
];
```

## CAPTCHA Integration

### 2Captcha API Integration
```javascript
async function solveCaptchaWith2Captcha(page, captchaSelector) {
  const captchaElement = await page.$(captchaSelector);
  const siteKey = await page.evaluate(el => {
    return el.getAttribute('data-sitekey') ||
           el.querySelector('[data-sitekey]')?.getAttribute('data-sitekey');
  }, captchaElement);

  // Submit to 2Captcha
  const submitResponse = await fetch('http://2captcha.com/in.php', {
    method: 'POST',
    body: new URLSearchParams({
      key: process.env.CAPTCHA_API_KEY,
      method: 'userrecaptcha',
      googlekey: siteKey,
      pageurl: page.url(),
      json: '1'
    })
  });

  const submitData = await submitResponse.json();

  if (submitData.status !== 1) {
    throw new Error('CAPTCHA submission failed');
  }

  // Poll for result
  let attempts = 0;
  while (attempts < 30) { // 30 attempts = ~2.5 minutes
    await new Promise(resolve => setTimeout(resolve, 5000));

    const resultResponse = await fetch('http://2captcha.com/res.php', {
      method: 'POST',
      body: new URLSearchParams({
        key: process.env.CAPTCHA_API_KEY,
        action: 'get',
        id: submitData.request,
        json: '1'
      })
    });

    const resultData = await resultResponse.json();

    if (resultData.status === 1) {
      return resultData.request; // CAPTCHA solution
    }

    attempts++;
  }

  throw new Error('CAPTCHA solving timeout');
}
```

## Testing Strategy

### Unit Tests
```javascript
describe('Walmart Checkout Module', () => {
  test('should verify product availability', async () => {
    const module = new WalmartModule();
    const result = await module.verifyAvailability('123456789');
    expect(result.available).toBe(true);
  });

  test('should handle CAPTCHA detection', async () => {
    const module = new WalmartModule();
    const hasCaptcha = await module.detectCaptcha(page);
    expect(hasCaptcha).toBeDefined();
  });
});
```

### Integration Tests
```javascript
describe('Walmart Full Checkout Flow', () => {
  test('should complete checkout with CAPTCHA', async () => {
    const module = new WalmartModule();
    const result = await module.executeCheckout(page, testConfig);

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBeDefined();
    expect(result.captchaSolved).toBe(true);
  });
});
```

### E2E Tests
```javascript
// Full browser test with CAPTCHA simulation
test('Walmart E2E Checkout', async ({ browser }) => {
  const context = await browser.newContext(walmartStealthConfig);
  const page = await context.newPage();

  // Complete checkout flow with CAPTCHA handling
  await page.goto('https://www.walmart.com/ip/test-product/12345');
  // ... full test implementation
});
```

## Configuration Template

### YAML Configuration
```yaml
site: walmart
product:
  url: "https://www.walmart.com/ip/test-product/123456789"
  sku: "123456789"
  offer_id: "ABC123"

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
  stealth_level: "ultra"
  max_retries: 5
  timeout: 60000
  proxy_type: "residential"
  captcha_service: "2captcha"
```

## Maintenance Notes

### Selector Updates
- Walmart frequently changes selectors, especially for CAPTCHA
- Monitor for new anti-bot measures and update accordingly
- Maintain multiple fallback selectors for critical elements

### CAPTCHA Updates
- Track reCAPTCHA and hCaptcha version updates
- Monitor 2Captcha API changes and response times
- Update solving strategies as CAPTCHA complexity increases

### Performance Optimization
- Optimize CAPTCHA solving workflow for speed
- Cache product availability data when possible
- Implement parallel proxy testing for reliability

### Legal Compliance
- Respect Walmart's Terms of Service
- Use residential proxies to avoid IP bans
- Implement rate limiting to prevent service disruption
- Focus on legitimate automation use cases
