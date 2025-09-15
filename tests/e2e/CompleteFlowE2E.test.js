// @ts-check
const { test, expect } = require('@playwright/test');
const SiteModuleFactory = require('../../src/modules/SiteModuleFactory');
const BrowserManager = require('../../src/core/BrowserManager');
const { ProxyManager } = require('../../src/core/ProxyManager');
const {
  CaptchaSolverManager,
  TwoCaptchaSolver
} = require('../../src/core/CaptchaSolver');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

test.describe('Complete Flow E2E Tests', () => {
  let browserManager;
  let siteModuleFactory;
  let proxyManager;
  let captchaSolverManager;
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Initialize all components
    browserManager = new BrowserManager(mockLogger);
    siteModuleFactory = new SiteModuleFactory(mockLogger);
    proxyManager = browserManager.getProxyManager();
    captchaSolverManager = new CaptchaSolverManager(mockLogger);
    
    // Add a mock proxy
    proxyManager.addProxy({
      server: '127.0.0.1',
      port: 8080,
      username: 'testuser',
      password: 'testpass'
    });
    
    // Add a mock CAPTCHA solver
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    captchaSolverManager.setApiKey('2captcha', 'test-api-key');
    
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

  test('should integrate all components for SauceDemo flow', async () => {
    // Create SauceDemo module
    const sauceDemoModule = siteModuleFactory.createModule('saucedemo');
    
    // Initialize module
    await sauceDemoModule.initialize();
    
    // Verify module is properly initialized
    expect(sauceDemoModule.initialized).toBe(true);
    expect(sauceDemoModule.siteName).toBe('base'); // SauceDemoModule extends BaseSiteModule
    
    // Set browser context
    sauceDemoModule.setBrowserContext(browser, context, page);
    
    // Verify ProxyManager integration
    const proxies = proxyManager.getAllProxies();
    expect(proxies).toHaveLength(1);
    expect(proxies[0].server).toBe('127.0.0.1');
    
    // Verify CaptchaSolver integration
    const solvers = Array.from(captchaSolverManager.solvers.keys());
    expect(solvers).toHaveLength(1);
    expect(solvers).toContain('2captcha');
    
    // Load homepage
    await page.goto('https://www.saucedemo.com/');
    
    // Verify page loaded correctly
    await expect(page).toHaveTitle(/Swag Labs/);
    
    // Test module's getInfo method
    const moduleInfo = sauceDemoModule.getInfo();
    expect(moduleInfo.siteName).toBe('base');
    expect(moduleInfo.initialized).toBe(true);
    
    // Test module's configuration methods
    const isValid = sauceDemoModule.validateConfig({ timeout: 30000 });
    expect(isValid).toBe(true);
    
    const mergedConfig = sauceDemoModule.mergeConfig({ customOption: 'test' });
    expect(mergedConfig.customOption).toBe('test');
    expect(mergedConfig.stealthLevel).toBe('high');
  });

  test('should handle CAPTCHA detection in module', async () => {
    // Create SauceDemo module
    const sauceDemoModule = siteModuleFactory.createModule('saucedemo');
    await sauceDemoModule.initialize();
    sauceDemoModule.setBrowserContext(browser, context, page);
    
    // Navigate to a page
    await page.goto('https://www.saucedemo.com/');
    
    // Test CAPTCHA handling (should return false since there's no CAPTCHA)
    const captchaHandled = await sauceDemoModule.handleCaptcha(page);
    expect(captchaHandled).toBe(true); // Should return true when no CAPTCHA is detected
  });

  test('should handle errors in module', async () => {
    // Create SauceDemo module
    const sauceDemoModule = siteModuleFactory.createModule('saucedemo');
    await sauceDemoModule.initialize();
    sauceDemoModule.setBrowserContext(browser, context, page);
    
    // Create a mock error
    const mockError = new Error('Test error');
    
    // Test error handling
    const errorResult = await sauceDemoModule.handleError(mockError, page);
    expect(errorResult.recovered).toBe(true); // Base implementation recovers all errors
    expect(errorResult.error).toBe('Test error');
  });

  test('should clean up resources properly', async () => {
    // Create SauceDemo module
    const sauceDemoModule = siteModuleFactory.createModule('saucedemo');
    await sauceDemoModule.initialize();
    sauceDemoModule.setBrowserContext(browser, context, page);
    
    // Verify resources are set
    expect(sauceDemoModule.browser).toBe(browser);
    expect(sauceDemoModule.context).toBe(context);
    expect(sauceDemoModule.page).toBe(page);
    expect(sauceDemoModule.initialized).toBe(true);
    
    // Clean up resources
    await sauceDemoModule.cleanup();
    
    // Verify resources are cleaned up
    expect(sauceDemoModule.browser).toBeNull();
    expect(sauceDemoModule.context).toBeNull();
    expect(sauceDemoModule.page).toBeNull();
    expect(sauceDemoModule.initialized).toBe(false);
  });

  test('should get component statistics', async () => {
    // Get ProxyManager statistics
    const proxyStats = proxyManager.getStats();
    expect(proxyStats.totalProxies).toBe(1);
    expect(proxyStats.activeProxies).toBe(1);
    
    // Get CaptchaSolver statistics
    const captchaStats = captchaSolverManager.getStats();
    expect(captchaStats.availableServices).toHaveLength(1);
    expect(captchaStats.availableServices[0]).toBe('2captcha');
    
    // Simulate proxy usage
    const proxy = proxyManager.getNextProxy();
    proxyManager.markProxySuccess(proxy.id, 100);
    
    // Verify updated statistics
    const updatedProxyStats = proxyManager.getStats();
    expect(updatedProxyStats.totalRequests).toBe(1);
    expect(updatedProxyStats.totalSuccess).toBe(1);
  });
});