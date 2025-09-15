const BrowserManager = require('../../src/core/BrowserManager');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('BrowserManager', () => {
  let browserManager;

  beforeEach(() => {
    browserManager = new BrowserManager(mockLogger);
  });

  afterEach(async () => {
    // Clean up any browser instances
    if (browserManager.browser) {
      await browserManager.closeAll();
    }
  });

  test('should create a BrowserManager instance', () => {
    expect(browserManager).toBeInstanceOf(BrowserManager);
    expect(browserManager.logger).toBe(mockLogger);
    expect(browserManager.contexts).toBeInstanceOf(Map);
  });

  test('should get a random user agent', () => {
    const userAgent = browserManager.getRandomUserAgent();
    expect(typeof userAgent).toBe('string');
    expect(userAgent.length).toBeGreaterThan(0);
  });

  // Note: Browser launching tests are commented out because they require actual browser installation
  // and would slow down testing significantly.

  /*
  test('should launch a browser', async () => {
    const browser = await browserManager.launchBrowser();
    expect(browser).toBeDefined();
    expect(browserManager.browser).toBe(browser);
  }, 10000); // 10 second timeout

  test('should create a browser context', async () => {
    await browserManager.launchBrowser();
    const { contextId, context } = await browserManager.createContext();
    
    expect(contextId).toBeDefined();
    expect(context).toBeDefined();
    expect(browserManager.contexts.has(contextId)).toBe(true);
  }, 15000); // 15 second timeout
  */
});