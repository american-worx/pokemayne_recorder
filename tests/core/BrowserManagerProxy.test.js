const BrowserManager = require('../../src/core/BrowserManager');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('BrowserManager Proxy Integration', () => {
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

  test('should create a BrowserManager with ProxyManager', () => {
    expect(browserManager).toBeInstanceOf(BrowserManager);
    expect(browserManager.proxyManager).toBeDefined();
    expect(typeof browserManager.getProxyManager).toBe('function');
  });

  test('should load proxies into ProxyManager', () => {
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080 },
      { server: '127.0.0.2', port: 8081 }
    ];

    browserManager.loadProxies(proxyConfigs);
    
    const proxyManager = browserManager.getProxyManager();
    const proxies = proxyManager.getAllProxies();
    
    expect(proxies).toHaveLength(2);
    expect(proxies[0].server).toBe('127.0.0.1');
    expect(proxies[1].server).toBe('127.0.0.2');
  });

  test('should get ProxyManager instance', () => {
    const proxyManager = browserManager.getProxyManager();
    expect(proxyManager).toBeDefined();
    expect(typeof proxyManager.addProxy).toBe('function');
  });
});