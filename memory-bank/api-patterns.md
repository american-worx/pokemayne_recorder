# API Patterns: Pokemayne Recorder

## E-Commerce API Architecture Overview

Modern e-commerce platforms use a combination of traditional form submissions and RESTful APIs. Understanding these patterns is crucial for building reliable checkout automation.

## Common API Patterns

### 1. Traditional Form-Based Checkout

#### Pattern: Sequential Form Submission
```javascript
// Traditional multi-step checkout
const checkoutSteps = [
  { url: '/cart', method: 'GET' },
  { url: '/checkout/shipping', method: 'POST', data: shippingInfo },
  { url: '/checkout/payment', method: 'POST', data: paymentInfo },
  { url: '/checkout/confirm', method: 'POST', data: confirmationData }
];

for (const step of checkoutSteps) {
  if (step.method === 'GET') {
    await page.goto(baseUrl + step.url);
  } else {
    await page.fill('form', step.data);
    await page.click('input[type="submit"]');
  }
  await page.waitForNavigation();
}
```

#### Pattern: AJAX Form Submission
```javascript
// Modern AJAX-based form handling
await page.evaluate((data) => {
  fetch('/checkout/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify(data)
  });
}, formData);
```

### 2. RESTful API Patterns

#### Pattern: Cart Management API
```javascript
// Shopify-style cart API
const cartApi = {
  addItem: async (variantId, quantity) => {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity })
    });
    return response.json();
  },

  updateItem: async (lineItemKey, quantity) => {
    const response = await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: { [lineItemKey]: quantity } })
    });
    return response.json();
  },

  getCart: async () => {
    const response = await fetch('/cart.js');
    return response.json();
  }
};
```

#### Pattern: Checkout API Flow
```javascript
// Modern checkout API flow
const checkoutApi = {
  createCheckout: async (cartToken) => {
    const response = await fetch('/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({ cart_token: cartToken })
    });
    return response.json();
  },

  updateShipping: async (checkoutId, shippingInfo) => {
    const response = await fetch(`/api/checkouts/${checkoutId}/shipping`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shippingInfo)
    });
    return response.json();
  },

  updatePayment: async (checkoutId, paymentInfo) => {
    const response = await fetch(`/api/checkouts/${checkoutId}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentInfo)
    });
    return response.json();
  },

  completeCheckout: async (checkoutId) => {
    const response = await fetch(`/api/checkouts/${checkoutId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }
};
```

### 3. GraphQL API Patterns

#### Pattern: Shopify Storefront API
```javascript
// GraphQL checkout mutation
const createCheckoutMutation = `
  mutation checkoutCreate($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        webUrl
        lineItems(first: 10) {
          edges {
            node {
              id
              quantity
              variant {
                id
                product {
                  title
                }
              }
            }
          }
        }
      }
      checkoutUserErrors {
        code
        field
        message
      }
    }
  }
`;

const variables = {
  input: {
    lineItems: [{ variantId: productVariantId, quantity: 1 }],
    email: customerEmail
  }
};

const response = await fetch('/api/2023-10/graphql.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': storefrontAccessToken
  },
  body: JSON.stringify({ query: createCheckoutMutation, variables })
});
```

## Authentication Patterns

### 1. Token-Based Authentication
```javascript
// JWT or API token authentication
const authHeaders = {
  'Authorization': `Bearer ${accessToken}`,
  'X-API-Key': apiKey,
  'Content-Type': 'application/json'
};
```

### 2. Session-Based Authentication
```javascript
// Cookie-based session management
await page.context().addCookies([{
  name: 'session_id',
  value: sessionToken,
  domain: '.store.com',
  path: '/',
  httpOnly: true,
  secure: true
}]);
```

### 3. CSRF Token Handling
```javascript
// Extract and use CSRF tokens
const csrfToken = await page.evaluate(() => {
  const token = document.querySelector('meta[name="csrf-token"]');
  return token ? token.content : null;
});

const headers = {
  'X-CSRF-Token': csrfToken,
  'Content-Type': 'application/json'
};
```

## Error Handling Patterns

### 1. HTTP Status Code Handling
```javascript
const handleApiResponse = async (response) => {
  switch (response.status) {
    case 200:
    case 201:
      return await response.json();
    case 400:
      throw new Error('Bad Request: Invalid input data');
    case 401:
      throw new Error('Unauthorized: Authentication required');
    case 403:
      throw new Error('Forbidden: Insufficient permissions');
    case 404:
      throw new Error('Not Found: Resource does not exist');
    case 429:
      throw new Error('Rate Limited: Too many requests');
    case 500:
      throw new Error('Server Error: Internal server error');
    default:
      throw new Error(`Unexpected status: ${response.status}`);
  }
};
```

### 2. API Error Response Parsing
```javascript
// Parse structured error responses
const parseApiErrors = (errorResponse) => {
  if (errorResponse.errors) {
    return errorResponse.errors.map(error => ({
      field: error.field || 'general',
      message: error.message,
      code: error.code
    }));
  }

  if (errorResponse.message) {
    return [{ field: 'general', message: errorResponse.message }];
  }

  return [{ field: 'general', message: 'Unknown error occurred' }];
};
```

## Rate Limiting Patterns

### 1. Request Throttling
```javascript
class ApiThrottler {
  constructor(requestsPerMinute = 60) {
    this.requestsPerMinute = requestsPerMinute;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < 60000);

    if (this.requests.length >= this.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}
```

### 2. Exponential Backoff
```javascript
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
```

## Platform-Specific API Patterns

### Shopify
- **Cart API**: `/cart/add.js`, `/cart/update.js`, `/cart/clear.js`
- **Checkout API**: Storefront API with GraphQL
- **Authentication**: Storefront Access Token
- **Rate Limits**: 2 requests per second (basic), higher for Plus

### WooCommerce
- **REST API**: `/wp-json/wc/v3/`
- **Authentication**: Consumer Key/Secret or JWT
- **Endpoints**: `/orders`, `/products`, `/customers`
- **Rate Limits**: Configurable, typically 25-100 requests/minute

### Magento
- **REST API**: `/rest/V1/`
- **GraphQL**: `/graphql`
- **Authentication**: Admin token or customer token
- **Rate Limits**: Configurable via admin panel

### BigCommerce
- **REST API**: `/api/v2/`
- **Authentication**: OAuth or Basic Auth
- **Rate Limits**: 20,000 requests/hour (default)
- **Webhooks**: Real-time order notifications

## Monitoring and Debugging

### API Request Logging
```javascript
const logApiRequest = (method, url, data, response, duration) => {
  logger.info('API Request', {
    method,
    url,
    requestSize: JSON.stringify(data).length,
    responseSize: JSON.stringify(response).length,
    duration,
    status: response.status,
    timestamp: new Date().toISOString()
  });
};
```

### Performance Monitoring
```javascript
const measureApiPerformance = async (apiCall) => {
  const startTime = Date.now();
  try {
    const result = await apiCall();
    const duration = Date.now() - startTime;
    metrics.recordApiCall(duration, 'success');
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.recordApiCall(duration, 'error');
    throw error;
  }
};
```

## Best Practices

### 1. API Version Management
- Always specify API versions in requests
- Monitor for deprecated endpoints
- Plan migration strategies for version updates

### 2. Response Caching
- Cache static data (products, categories)
- Implement intelligent cache invalidation
- Balance cache freshness with performance

### 3. Request Optimization
- Batch multiple operations when possible
- Use compression for large payloads
- Implement connection pooling

### 4. Error Recovery
- Implement circuit breaker patterns
- Use fallback strategies for failed requests
- Provide meaningful error messages to users

### 5. Security Considerations
- Never log sensitive data (payment info, tokens)
- Use HTTPS for all API communications
- Validate and sanitize all input data
- Implement proper authentication and authorization
