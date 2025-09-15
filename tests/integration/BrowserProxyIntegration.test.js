const BrowserManager = require('../../src/core/BrowserManager');
const { ProxyManager } = require('../../src/core/ProxyManager');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('Browser-Proxy Integration', () => {
  let browserManager;
  let proxyManager;

  beforeEach(() => {
    browserManager = new BrowserManager(mockLogger);
    proxyManager = browserManager.getProxyManager();
  });

  afterEach(async () => {
    // Clean up any browser instances
    if (browserManager.browser) {
      await browserManager.closeAll();
    }
  });

  test('should integrate ProxyManager with BrowserManager', () => {
    expect(browserManager.proxyManager).toBeInstanceOf(ProxyManager);
    expect(browserManager.getProxyManager()).toBe(proxyManager);
  });

  test('should load proxies into BrowserManager', () => {
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080 },
      { server: '127.0.0.2', port: 8081 },
      { server: '127.0.0.3', port: 8082 }
    ];

    browserManager.loadProxies(proxyConfigs);
    
    const proxies = proxyManager.getAllProxies();
    expect(proxies).toHaveLength(3);
    
    expect(proxies[0].server).toBe('127.0.0.1');
    expect(proxies[0].port).toBe(8080);
    
    expect(proxies[1].server).toBe('127.0.0.2');
    expect(proxies[1].port).toBe(8081);
    
    expect(proxies[2].server).toBe('127.0.0.3');
    expect(proxies[2].port).toBe(8082);
  });

  test('should get next proxy from ProxyManager', () => {
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080 },
      { server: '127.0.0.2', port: 8081 }
    ];

    browserManager.loadProxies(proxyConfigs);
    
    const proxy1 = proxyManager.getNextProxy();
    const proxy2 = proxyManager.getNextProxy();
    const proxy3 = proxyManager.getNextProxy(); // Should wrap around
    
    expect(proxy1).toBeDefined();
    expect(proxy2).toBeDefined();
    expect(proxy3).toBeDefined();
    
    expect(proxy1.server).toBe('127.0.0.1');
    expect(proxy2.server).toBe('127.0.0.2');
    expect(proxy3.server).toBe('127.0.0.1'); // Wrap around
  });

  test('should mark proxy success and failure', () => {
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080 }
    ];

    browserManager.loadProxies(proxyConfigs);
    const proxy = proxyManager.getNextProxy();
    
    // Initial state
    expect(proxy.successCount).toBe(0);
    expect(proxy.failureCount).toBe(0);
    expect(proxy.totalRequests).toBe(0);
    expect(proxy.healthScore).toBe(1.0);
    
    // Mark success
    proxyManager.markProxySuccess(proxy.id, 100);
    
    expect(proxy.successCount).toBe(1);
    expect(proxy.totalRequests).toBe(1);
    expect(proxy.avgResponseTime).toBe(100);
    
    // Mark failure
    proxyManager.markProxyFailure(proxy.id);
    
    expect(proxy.failureCount).toBe(1);
    expect(proxy.totalRequests).toBe(2);
    expect(proxy.healthScore).toBeLessThan(1.0);
  });

  test('should get proxy statistics', () => {
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080 },
      { server: '127.0.0.2', port: 8081 }
    ];

    browserManager.loadProxies(proxyConfigs);
    
    // Use one proxy
    const proxy = proxyManager.getNextProxy();
    proxyManager.markProxySuccess(proxy.id, 150);
    proxyManager.markProxyFailure(proxy.id);
    
    const stats = proxyManager.getStats();
    
    expect(stats.totalProxies).toBe(2);
    expect(stats.totalRequests).toBe(2);
    expect(stats.totalSuccess).toBe(1);
    expect(stats.overallSuccessRate).toBe(0.5);
    expect(stats.proxies).toHaveLength(2);
  });

  test('should get healthy proxies', () => {
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080 },
      { server: '127.0.0.2', port: 8081 }
    ];

    browserManager.loadProxies(proxyConfigs);
    
    const proxies = proxyManager.getAllProxies();
    
    // Make one proxy unhealthy
    for (let i = 0; i < 10; i++) {
      proxyManager.markProxyFailure(proxies[0].id);
    }
    
    const healthyProxies = proxyManager.getHealthyProxies();
    expect(healthyProxies).toHaveLength(1);
    expect(healthyProxies[0].id).toBe(proxies[1].id);
  });
});