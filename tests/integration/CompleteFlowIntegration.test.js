const SiteModuleFactory = require('../../src/modules/SiteModuleFactory');
const BrowserManager = require('../../src/core/BrowserManager');
const { ProxyManager } = require('../../src/core/ProxyManager');
const {
  CaptchaSolverManager,
  TwoCaptchaSolver,
  AntiCaptchaSolver
} = require('../../src/core/CaptchaSolver');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('Complete Flow Integration', () => {
  let siteModuleFactory;
  let browserManager;
  let proxyManager;
  let captchaSolverManager;

  beforeEach(() => {
    siteModuleFactory = new SiteModuleFactory(mockLogger);
    browserManager = new BrowserManager(mockLogger);
    proxyManager = browserManager.getProxyManager();
    captchaSolverManager = new CaptchaSolverManager(mockLogger);
  });

  afterEach(async () => {
    // Clean up any browser instances
    if (browserManager.browser) {
      await browserManager.closeAll();
    }
  });

  test('should integrate all core components', () => {
    // Verify all components are properly instantiated
    expect(siteModuleFactory).toBeDefined();
    expect(browserManager).toBeDefined();
    expect(proxyManager).toBeDefined();
    expect(captchaSolverManager).toBeDefined();
    
    // Verify component relationships
    expect(browserManager.proxyManager).toBe(proxyManager);
  });

  test('should create and initialize site module', async () => {
    const module = siteModuleFactory.createModule('nike');
    
    expect(module).toBeDefined();
    expect(module.initialized).toBe(false);
    
    await module.initialize();
    expect(module.initialized).toBe(true);
  });

  test('should load proxies into system', () => {
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080, username: 'user1', password: 'pass1' },
      { server: '127.0.0.2', port: 8081, username: 'user2', password: 'pass2' }
    ];

    browserManager.loadProxies(proxyConfigs);
    
    const proxies = proxyManager.getAllProxies();
    expect(proxies).toHaveLength(2);
    
    // Verify proxy configuration
    expect(proxies[0].server).toBe('127.0.0.1');
    expect(proxies[0].port).toBe(8080);
    expect(proxies[0].username).toBe('user1');
    expect(proxies[0].password).toBe('pass1');
    
    expect(proxies[1].server).toBe('127.0.0.2');
    expect(proxies[1].port).toBe(8081);
    expect(proxies[1].username).toBe('user2');
    expect(proxies[1].password).toBe('pass2');
  });

  test('should integrate CAPTCHA solvers', () => {
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    const antiCaptcha = new AntiCaptchaSolver(mockLogger);
    
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    captchaSolverManager.addSolver('anticaptcha', antiCaptcha);
    captchaSolverManager.setApiKey('2captcha', 'test-key-1');
    captchaSolverManager.setApiKey('anticaptcha', 'test-key-2');
    
    const solvers = Array.from(captchaSolverManager.solvers.keys());
    expect(solvers).toHaveLength(2);
    expect(solvers).toContain('2captcha');
    expect(solvers).toContain('anticaptcha');
    
    expect(twoCaptcha.apiKey).toBe('test-key-1');
    expect(antiCaptcha.apiKey).toBe('test-key-2');
  });

  test('should get component statistics', () => {
    // Load proxies
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080 },
      { server: '127.0.0.2', port: 8081 }
    ];
    browserManager.loadProxies(proxyConfigs);
    
    // Use proxies
    const proxy1 = proxyManager.getNextProxy();
    proxyManager.markProxySuccess(proxy1.id, 150);
    proxyManager.markProxyFailure(proxy1.id);
    
    // Get statistics
    const proxyStats = proxyManager.getStats();
    expect(proxyStats.totalProxies).toBe(2);
    expect(proxyStats.totalRequests).toBe(2);
    expect(proxyStats.totalSuccess).toBe(1);
    
    // Add CAPTCHA solvers
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    
    const captchaStats = captchaSolverManager.getStats();
    expect(captchaStats.availableServices).toHaveLength(1);
    expect(captchaStats.availableServices[0]).toBe('2captcha');
  });

  test('should handle component interactions', async () => {
    // Create site module
    const module = siteModuleFactory.createModule('nike');
    
    // Load proxies
    const proxyConfigs = [
      { server: '127.0.0.1', port: 8080 }
    ];
    browserManager.loadProxies(proxyConfigs);
    
    // Add CAPTCHA solvers
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    captchaSolverManager.setApiKey('2captcha', 'test-key');
    
    // Initialize module
    await module.initialize();
    expect(module.initialized).toBe(true);
    
    // Verify all components are working together
    const proxies = proxyManager.getAllProxies();
    expect(proxies).toHaveLength(1);
    
    const solvers = Array.from(captchaSolverManager.solvers.keys());
    expect(solvers).toHaveLength(1);
  });

  test('should get supported sites from factory', () => {
    const supportedSites = siteModuleFactory.getSupportedSites();
    
    expect(supportedSites).toContain('nike');
    expect(supportedSites).toContain('target');
    expect(supportedSites).toContain('bestbuy');
    expect(supportedSites).toContain('saucedemo');
  });

  test('should discover available modules', async () => {
    const modules = await siteModuleFactory.discoverModules();
    
    // Should include at least the core modules
    // Note: The discovery returns camelCase names like "bestBuy", "sauceDemo"
    expect(modules.length).toBeGreaterThanOrEqual(4);
    expect(modules).toContain('nike');
    expect(modules).toContain('target');
    expect(modules).toContain('bestBuy'); // Note: camelCase
    expect(modules).toContain('sauceDemo'); // Note: camelCase
  });
});