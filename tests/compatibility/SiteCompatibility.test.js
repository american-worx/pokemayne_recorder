const SiteModuleFactory = require('../../src/modules/SiteModuleFactory');
const NikeModule = require('../../src/modules/NikeModule');
const TargetModule = require('../../src/modules/TargetModule');
const BestBuyModule = require('../../src/modules/BestBuyModule');
const WalmartModule = require('../../src/modules/WalmartModule');
const SauceDemoModule = require('../../src/modules/SauceDemoModule');
const ShopifyModule = require('../../src/modules/ShopifyModule');
const BaseSiteModule = require('../../src/modules/BaseSiteModule');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('Site Compatibility Tests', () => {
  let siteModuleFactory;

  beforeEach(() => {
    siteModuleFactory = new SiteModuleFactory(mockLogger);
  });

  test('should create and validate Nike module compatibility', () => {
    const module = siteModuleFactory.createModule('nike');
    
    // Verify module type
    expect(module).toBeInstanceOf(NikeModule);
    
    // Verify properties
    expect(module.siteName).toBe('nike');
    expect(module.version).toBe('1.0.0');
    expect(module.initialized).toBe(false);
    
    // Verify methods exist
    expect(typeof module.initialize).toBe('function');
    expect(typeof module.executeCheckout).toBe('function');
    expect(typeof module.recordFlow).toBe('function');
    expect(typeof module.handleCaptcha).toBe('function');
    expect(typeof module.handleError).toBe('function');
    expect(typeof module.getInfo).toBe('function');
    
    // Verify configuration methods
    expect(typeof module.validateConfig).toBe('function');
    expect(typeof module.mergeConfig).toBe('function');
  });

  test('should create and validate Target module compatibility', () => {
    const module = siteModuleFactory.createModule('target');
    
    // Verify module type
    expect(module).toBeInstanceOf(TargetModule);
    
    // Verify properties
    expect(module.siteName).toBe('target');
    expect(module.version).toBe('1.0.0');
    expect(module.initialized).toBe(false);
    
    // Verify methods exist
    expect(typeof module.initialize).toBe('function');
    expect(typeof module.executeCheckout).toBe('function');
    expect(typeof module.recordFlow).toBe('function');
    expect(typeof module.handleCaptcha).toBe('function');
    expect(typeof module.handleError).toBe('function');
    expect(typeof module.getInfo).toBe('function');
    
    // Verify configuration methods
    expect(typeof module.validateConfig).toBe('function');
    expect(typeof module.mergeConfig).toBe('function');
  });

  test('should create and validate BestBuy module compatibility', () => {
    const module = siteModuleFactory.createModule('bestbuy');
    
    // Verify module type
    expect(module).toBeInstanceOf(BestBuyModule);
    
    // Verify properties
    expect(module.siteName).toBe('bestbuy');
    expect(module.version).toBe('1.0.0');
    expect(module.initialized).toBe(false);
    
    // Verify methods exist
    expect(typeof module.initialize).toBe('function');
    expect(typeof module.executeCheckout).toBe('function');
    expect(typeof module.recordFlow).toBe('function');
    expect(typeof module.handleCaptcha).toBe('function');
    expect(typeof module.handleError).toBe('function');
    expect(typeof module.getInfo).toBe('function');
    
    // Verify configuration methods
    expect(typeof module.validateConfig).toBe('function');
    expect(typeof module.mergeConfig).toBe('function');
  });

  test('should create and validate Walmart module compatibility', () => {
    const module = siteModuleFactory.createModule('walmart');
    
    // Verify module type
    expect(module).toBeInstanceOf(WalmartModule);
    
    // Verify properties
    expect(module.siteName).toBe('walmart');
    expect(module.version).toBe('1.0.0');
    expect(module.initialized).toBe(false);
    
    // Verify methods exist
    expect(typeof module.initialize).toBe('function');
    expect(typeof module.executeCheckout).toBe('function');
    expect(typeof module.recordFlow).toBe('function');
    expect(typeof module.handleCaptcha).toBe('function');
    expect(typeof module.handleError).toBe('function');
    expect(typeof module.getInfo).toBe('function');
    
    // Verify configuration methods
    expect(typeof module.validateConfig).toBe('function');
    expect(typeof module.mergeConfig).toBe('function');
  });

  test('should create and validate SauceDemo module compatibility', () => {
    const module = siteModuleFactory.createModule('saucedemo');
    
    // Verify module type
    expect(module).toBeInstanceOf(SauceDemoModule);
    
    // Verify properties
    expect(module.siteName).toBe('saucedemo');
    expect(module.version).toBe('1.0.0');
    expect(module.initialized).toBe(false);
    
    // Verify methods exist
    expect(typeof module.initialize).toBe('function');
    expect(typeof module.executeCheckout).toBe('function');
    expect(typeof module.recordFlow).toBe('function');
    expect(typeof module.handleCaptcha).toBe('function');
    expect(typeof module.handleError).toBe('function');
    expect(typeof module.getInfo).toBe('function');
    
    // Verify configuration methods
    expect(typeof module.validateConfig).toBe('function');
    expect(typeof module.mergeConfig).toBe('function');
    
    // Verify additional methods
    expect(typeof module.generateTestData).toBe('function');
    expect(typeof module.validateCheckoutResult).toBe('function');
  });

  test('should create and validate Shopify module compatibility', () => {
    const module = siteModuleFactory.createModule('shopify');
    
    // ShopifyModule extends BaseSiteModule
    expect(module).toBeInstanceOf(ShopifyModule);
    
    // Verify properties
    expect(module.siteName).toBe('shopify'); // ShopifyModule does override siteName
    expect(module.version).toBe('1.0.0');
    expect(module.initialized).toBe(false);
    
    // Verify methods exist
    expect(typeof module.initialize).toBe('function');
    expect(typeof module.executeCheckout).toBe('function');
    expect(typeof module.recordFlow).toBe('function');
    expect(typeof module.handleCaptcha).toBe('function');
    expect(typeof module.handleError).toBe('function');
    expect(typeof module.getInfo).toBe('function');
    
    // Verify configuration methods
    expect(typeof module.validateConfig).toBe('function');
    expect(typeof module.mergeConfig).toBe('function');
  });

  test('should handle unsupported site gracefully', () => {
    const module = siteModuleFactory.createModule('unsupported-site');
    
    // Should fall back to BaseSiteModule
    expect(module).toBeInstanceOf(BaseSiteModule);
    
    // Verify properties
    expect(module.siteName).toBe('base');
    expect(module.version).toBe('1.0.0');
    expect(module.initialized).toBe(false);
  });

  test('should get module information for all supported sites', () => {
    const sites = ['nike', 'target', 'bestbuy', 'walmart', 'saucedemo', 'shopify'];
    
    sites.forEach(site => {
      const module = siteModuleFactory.createModule(site);
      const info = module.getInfo();
      
      expect(info).toBeDefined();
      expect(typeof info.siteName).toBe('string');
      expect(typeof info.version).toBe('string');
      expect(typeof info.initialized).toBe('boolean');
      expect(typeof info.config).toBe('object');
    });
  });

  test('should validate configuration for all modules', () => {
    const sites = ['nike', 'target', 'bestbuy', 'walmart', 'saucedemo', 'shopify'];
    
    sites.forEach(site => {
      const module = siteModuleFactory.createModule(site);
      
      // Test valid configuration
      const validConfig = { timeout: 30000, stealthLevel: 'high' };
      expect(module.validateConfig(validConfig)).toBe(true);
      
      // Test invalid configuration
      expect(module.validateConfig(null)).toBe(false);
      expect(module.validateConfig(undefined)).toBe(false);
    });
  });

  test('should merge configuration with defaults for all modules', () => {
    const sites = ['nike', 'target', 'bestbuy', 'walmart', 'saucedemo', 'shopify'];
    
    sites.forEach(site => {
      const module = siteModuleFactory.createModule(site);
      
      const customConfig = { timeout: 60000, customOption: 'test' };
      const mergedConfig = module.mergeConfig(customConfig);
      
      // Should preserve custom values
      expect(mergedConfig.timeout).toBe(60000);
      expect(mergedConfig.customOption).toBe('test');
      
      // Should include default values
      expect(mergedConfig.stealthLevel).toBe('high');
      expect(mergedConfig.maxRetries).toBe(3);
    });
  });

  test('should get supported sites from factory', () => {
    const supportedSites = siteModuleFactory.getSupportedSites();
    
    expect(Array.isArray(supportedSites)).toBe(true);
    expect(supportedSites.length).toBeGreaterThanOrEqual(4);
    
    // Should include all major sites
    expect(supportedSites).toContain('nike');
    expect(supportedSites).toContain('target');
    expect(supportedSites).toContain('bestbuy');
    expect(supportedSites).toContain('saucedemo');
  });
});