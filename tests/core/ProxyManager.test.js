const { ProxyManager, Proxy } = require('../../src/core/ProxyManager');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('ProxyManager', () => {
  let proxyManager;

  beforeEach(() => {
    proxyManager = new ProxyManager(mockLogger);
  });

  afterEach(() => {
    proxyManager.destroy();
  });

  test('should create a ProxyManager instance', () => {
    expect(proxyManager).toBeInstanceOf(ProxyManager);
    expect(proxyManager.logger).toBe(mockLogger);
    expect(proxyManager.proxies).toBeInstanceOf(Map);
    expect(proxyManager.proxyList).toBeInstanceOf(Array);
  });

  test('should add a proxy to the pool', () => {
    const proxyConfig = {
      server: '127.0.0.1',
      port: 8080,
      username: 'user',
      password: 'pass'
    };

    const proxy = proxyManager.addProxy(proxyConfig);
    
    expect(proxy).toBeInstanceOf(Proxy);
    expect(proxy.server).toBe('127.0.0.1');
    expect(proxy.port).toBe(8080);
    expect(proxy.username).toBe('user');
    expect(proxy.password).toBe('pass');
    expect(proxyManager.proxies.size).toBe(1);
    expect(proxyManager.proxyList.length).toBe(1);
  });

  test('should remove a proxy from the pool', () => {
    const proxyConfig = {
      server: '127.0.0.1',
      port: 8080
    };

    const proxy = proxyManager.addProxy(proxyConfig);
    const removed = proxyManager.removeProxy(proxy.id);
    
    expect(removed).toBe(true);
    expect(proxyManager.proxies.size).toBe(0);
    expect(proxyManager.proxyList.length).toBe(0);
  });

  test('should get a proxy by ID', () => {
    const proxyConfig = {
      server: '127.0.0.1',
      port: 8080
    };

    const proxy = proxyManager.addProxy(proxyConfig);
    const retrievedProxy = proxyManager.getProxy(proxy.id);
    
    expect(retrievedProxy).toBe(proxy);
    expect(retrievedProxy.server).toBe('127.0.0.1');
  });

  test('should return null for non-existent proxy', () => {
    const proxy = proxyManager.getProxy('non-existent');
    expect(proxy).toBeNull();
  });

  test('should get next proxy using round-robin', () => {
    const proxyConfig1 = { server: '127.0.0.1', port: 8080 };
    const proxyConfig2 = { server: '127.0.0.2', port: 8081 };
    
    const proxy1 = proxyManager.addProxy(proxyConfig1);
    const proxy2 = proxyManager.addProxy(proxyConfig2);
    
    const nextProxy1 = proxyManager.getNextProxy();
    const nextProxy2 = proxyManager.getNextProxy();
    const nextProxy3 = proxyManager.getNextProxy();
    
    expect(nextProxy1).toBe(proxy1);
    expect(nextProxy2).toBe(proxy2);
    expect(nextProxy3).toBe(proxy1); // Should wrap around
  });

  test('should get the best proxy based on health score', () => {
    const proxyConfig1 = { server: '127.0.0.1', port: 8080 };
    const proxyConfig2 = { server: '127.0.0.2', port: 8081 };
    const proxyConfig3 = { server: '127.0.0.3', port: 8082 };
    
    const proxy1 = proxyManager.addProxy(proxyConfig1);
    const proxy2 = proxyManager.addProxy(proxyConfig2);
    const proxy3 = proxyManager.addProxy(proxyConfig3);
    
    // Mark some successes and failures to affect health scores
    proxy1.markSuccess(100);
    proxy1.markSuccess(150);
    proxy1.markFailure();
    
    proxy2.markSuccess(200);
    proxy2.markSuccess(250);
    proxy2.markSuccess(300);
    
    proxy3.markSuccess(50);
    proxy3.markSuccess(75);
    proxy3.markSuccess(100);
    proxy3.markSuccess(125);
    
    const bestProxy = proxyManager.getBestProxy();
    expect(bestProxy).toBe(proxy3); // Should have the best health score
  });

  test('should get all proxies', () => {
    const proxyConfig1 = { server: '127.0.0.1', port: 8080 };
    const proxyConfig2 = { server: '127.0.0.2', port: 8081 };
    
    const proxy1 = proxyManager.addProxy(proxyConfig1);
    const proxy2 = proxyManager.addProxy(proxyConfig2);
    
    const allProxies = proxyManager.getAllProxies();
    expect(allProxies).toHaveLength(2);
    expect(allProxies[0]).toBeInstanceOf(Proxy);
    expect(allProxies[1]).toBeInstanceOf(Proxy);
  });

  test('should get healthy proxies', () => {
    const proxyConfig1 = { server: '127.0.0.1', port: 8080 };
    const proxyConfig2 = { server: '127.0.0.2', port: 8081 };
    
    const proxy1 = proxyManager.addProxy(proxyConfig1);
    const proxy2 = proxyManager.addProxy(proxyConfig2);
    
    // Make one proxy unhealthy
    for (let i = 0; i < 10; i++) {
      proxy1.markFailure();
    }
    
    const healthyProxies = proxyManager.getHealthyProxies();
    expect(healthyProxies).toHaveLength(1);
    expect(healthyProxies[0]).toBe(proxy2);
  });

  test('should mark proxy success and update metrics', () => {
    const proxyConfig = { server: '127.0.0.1', port: 8080 };
    const proxy = proxyManager.addProxy(proxyConfig);
    
    proxyManager.markProxySuccess(proxy.id, 100);
    
    expect(proxy.successCount).toBe(1);
    expect(proxy.totalRequests).toBe(1);
    expect(proxy.avgResponseTime).toBe(100);
  });

  test('should mark proxy failure and update metrics', () => {
    const proxyConfig = { server: '127.0.0.1', port: 8080 };
    const proxy = proxyManager.addProxy(proxyConfig);
    
    proxyManager.markProxyFailure(proxy.id);
    
    expect(proxy.failureCount).toBe(1);
    expect(proxy.totalRequests).toBe(1);
  });

  test('should get proxy statistics', () => {
    const proxyConfig1 = { server: '127.0.0.1', port: 8080 };
    const proxyConfig2 = { server: '127.0.0.2', port: 8081 };
    
    const proxy1 = proxyManager.addProxy(proxyConfig1);
    const proxy2 = proxyManager.addProxy(proxyConfig2);
    
    proxy1.markSuccess(100);
    proxy1.markFailure();
    proxy2.markSuccess(200);
    
    const stats = proxyManager.getStats();
    
    expect(stats.totalProxies).toBe(2);
    expect(stats.totalRequests).toBe(3);
    expect(stats.totalSuccess).toBe(2);
    expect(stats.overallSuccessRate).toBeCloseTo(0.667, 3);
    expect(stats.proxies).toHaveLength(2);
  });

  test('should get Playwright configuration', () => {
    const proxyConfig = {
      server: '127.0.0.1',
      port: 8080,
      username: 'user',
      password: 'pass',
      protocol: 'https'
    };
    
    const proxy = new Proxy(proxyConfig);
    const playwrightConfig = proxy.getPlaywrightConfig();
    
    expect(playwrightConfig.server).toBe('https://127.0.0.1:8080');
    expect(playwrightConfig.username).toBe('user');
    expect(playwrightConfig.password).toBe('pass');
  });

  test('should calculate health score correctly', () => {
    const proxy = new Proxy({ server: '127.0.0.1', port: 8080 });
    
    // Test initial health score
    expect(proxy.healthScore).toBe(1.0);
    
    // Test with successes only
    proxy.markSuccess(100);
    proxy.markSuccess(200);
    expect(proxy.healthScore).toBeCloseTo(0.991, 3);
    
    // Test with mixed results
    proxy.markFailure();
    proxy.markFailure();
    expect(proxy.healthScore).toBeLessThan(1.0);
    expect(proxy.healthScore).toBeGreaterThan(0.0);
  });

  test('should determine if proxy is healthy', () => {
    const proxy = new Proxy({ server: '127.0.0.1', port: 8080 });
    
    // Should be healthy initially
    expect(proxy.isHealthy()).toBe(true);
    
    // Make it unhealthy
    proxy.disable();
    expect(proxy.isHealthy()).toBe(false);
    
    // Re-enable and test with poor performance
    proxy.enable();
    for (let i = 0; i < 20; i++) {
      proxy.markFailure();
    }
    expect(proxy.isHealthy()).toBe(false);
  });
});

describe('Proxy', () => {
  test('should create a Proxy instance', () => {
    const config = {
      server: '127.0.0.1',
      port: 8080,
      username: 'user',
      password: 'pass',
      protocol: 'https'
    };
    
    const proxy = new Proxy(config);
    
    expect(proxy).toBeInstanceOf(Proxy);
    expect(proxy.server).toBe('127.0.0.1');
    expect(proxy.port).toBe(8080);
    expect(proxy.username).toBe('user');
    expect(proxy.password).toBe('pass');
    expect(proxy.protocol).toBe('https');
    expect(proxy.isActive).toBe(true);
  });

  test('should generate ID automatically', () => {
    const config = { server: '127.0.0.1', port: 8080 };
    const proxy = new Proxy(config);
    
    expect(proxy.id).toBe('http://127.0.0.1:8080');
  });
});