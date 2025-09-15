// @ts-check
const { test, expect } = require('@playwright/test');
const SiteModuleFactory = require('../../src/modules/SiteModuleFactory');
const BrowserManager = require('../../src/core/BrowserManager');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

test.describe('SauceDemo E2E Tests', () => {
  let browserManager;
  let siteModuleFactory;
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Initialize components
    browserManager = new BrowserManager(mockLogger);
    siteModuleFactory = new SiteModuleFactory(mockLogger);
    
    // Launch browser
    browser = await browserManager.launchBrowser({ headless: true });
  });

  test.beforeEach(async () => {
    // Create a new context and page for each test
    const result = await browserManager.createContext();
    context = result.context;
    page = await context.newPage();
  });

  test.afterEach(async () => {
    // Close context after each test
    if (context) {
      await context.close();
    }
  });

  test.afterAll(async () => {
    // Close browser after all tests
    if (browserManager) {
      await browserManager.closeAll();
    }
  });

  test('should load SauceDemo homepage', async () => {
    await page.goto('https://www.saucedemo.com/');
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle(/Swag Labs/);
    await expect(page.locator('[data-test="username"]')).toBeVisible();
    await expect(page.locator('[data-test="password"]')).toBeVisible();
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });

  test('should login to SauceDemo', async () => {
    await page.goto('https://www.saucedemo.com/');
    
    // Fill login form
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    
    // Click login button
    await page.locator('[data-test="login-button"]').click();
    
    // Verify successful login
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    await expect(page.locator('.product_label')).toBeVisible();
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should add item to cart and checkout', async () => {
    await page.goto('https://www.saucedemo.com/');
    
    // Login
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    
    // Add item to cart
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    
    // Go to cart
    await page.locator('.shopping_cart_link').click();
    
    // Verify item in cart
    await expect(page.locator('.cart_item')).toBeVisible();
    await expect(page.locator('.inventory_item_name')).toContainText('Sauce Labs Backpack');
    
    // Checkout
    await page.locator('[data-test="checkout"]').click();
    
    // Fill checkout form
    await page.locator('[data-test="firstName"]').fill('John');
    await page.locator('[data-test="lastName"]').fill('Doe');
    await page.locator('[data-test="postalCode"]').fill('12345');
    await page.locator('[data-test="continue"]').click();
    
    // Verify checkout overview
    await expect(page.locator('.summary_info')).toBeVisible();
    await expect(page.locator('[data-test="finish"]').first()).toBeVisible();
    
    // Complete checkout
    await page.locator('[data-test="finish"]').click();
    
    // Verify checkout complete
    await expect(page.locator('.complete-header')).toBeVisible();
    await expect(page.locator('.complete-header')).toContainText('Thank you for your order!');
  });

  test('should use SauceDemoModule to execute checkout flow', async () => {
    // Create SauceDemo module
    const sauceDemoModule = siteModuleFactory.createModule('saucedemo');
    
    // Initialize module
    await sauceDemoModule.initialize();
    
    // Set browser context
    sauceDemoModule.setBrowserContext(browser, context, page);
    
    // Define a simple flow configuration
    const flowConfig = {
      site: 'saucedemo',
      steps: [
        {
          action: 'goto',
          url: 'https://www.saucedemo.com/',
          description: 'Navigate to login page'
        },
        {
          action: 'fill',
          selector: '[data-test="username"]',
          value: 'standard_user',
          description: 'Enter username'
        },
        {
          action: 'fill',
          selector: '[data-test="password"]',
          value: 'secret_sauce',
          description: 'Enter password'
        },
        {
          action: 'click',
          selector: '[data-test="login-button"]',
          description: 'Click login button'
        },
        {
          action: 'waitForSelector',
          selector: '.product_label',
          description: 'Wait for product page to load'
        }
      ]
    };
    
    // Execute the flow
    const result = await sauceDemoModule.executeCheckout(page, flowConfig);
    
    // Verify successful execution
    expect(result.success).toBe(true);
    expect(result.stepsExecuted).toBe(5);
    
    // Verify we're on the products page
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  });
});