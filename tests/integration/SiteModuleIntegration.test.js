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

describe('Site Module Integration', () => {
  let siteModuleFactory;

  beforeEach(() => {
    siteModuleFactory = new SiteModuleFactory(mockLogger);
  });

  test('should create Nike module through factory', () => {
    const module = siteModuleFactory.createModule('nike');
    
    expect(module).toBeInstanceOf(NikeModule);
    expect(module.siteName).toBe('nike');
    expect(module.initialized).toBe(false);
  });

  test('should create Target module through factory', () => {
    const module = siteModuleFactory.createModule('target');
    
    expect(module).toBeInstanceOf(TargetModule);
    expect(module.siteName).toBe('target');
    expect(module.initialized).toBe(false);
  });

  test('should create BestBuy module through factory', () => {
    const module = siteModuleFactory.createModule('bestbuy');
    
    expect(module).toBeInstanceOf(BestBuyModule);
    expect(module.siteName).toBe('bestbuy');
    expect(module.initialized).toBe(false);
  });

  test('should create Walmart module through factory', () => {
    const module = siteModuleFactory.createModule('walmart');
    
    expect(module).toBeInstanceOf(WalmartModule);
    expect(module.siteName).toBe('walmart');
    expect(module.initialized).toBe(false);
  });

  test('should create SauceDemo module through factory', () => {
    const module = siteModuleFactory.createModule('saucedemo');
    
    expect(module).toBeInstanceOf(SauceDemoModule);
    expect(module.siteName).toBe('saucedemo');
    expect(module.initialized).toBe(false);
  });

  test('should create Shopify module through factory', () => {
    const module = siteModuleFactory.createModule('shopify');
    
    expect(module).toBeInstanceOf(ShopifyModule);
    expect(module.siteName).toBe('shopify');
    expect(module.initialized).toBe(false);
  });

  test('should initialize Nike module', async () => {
    const module = siteModuleFactory.createModule('nike');
    
    expect(module.initialized).toBe(false);
    await module.initialize();
    expect(module.initialized).toBe(true);
  });

  test('should initialize Target module', async () => {
    const module = siteModuleFactory.createModule('target');
    
    expect(module.initialized).toBe(false);
    await module.initialize();
    expect(module.initialized).toBe(true);
  });

  test('should initialize BestBuy module', async () => {
    const module = siteModuleFactory.createModule('bestbuy');
    
    expect(module.initialized).toBe(false);
    await module.initialize();
    expect(module.initialized).toBe(true);
  });

  test('should initialize Walmart module', async () => {
    const module = siteModuleFactory.createModule('walmart');
    
    expect(module.initialized).toBe(false);
    await module.initialize();
    expect(module.initialized).toBe(true);
  });

  test('should get module information', () => {
    const nikeModule = siteModuleFactory.createModule('nike');
    const targetModule = siteModuleFactory.createModule('target');
    const bestbuyModule = siteModuleFactory.createModule('bestbuy');
    const walmartModule = siteModuleFactory.createModule('walmart');
    const saucedemoModule = siteModuleFactory.createModule('saucedemo');
    const shopifyModule = siteModuleFactory.createModule('shopify');
    
    const nikeInfo = nikeModule.getInfo();
    const targetInfo = targetModule.getInfo();
    const bestbuyInfo = bestbuyModule.getInfo();
    const walmartInfo = walmartModule.getInfo();
    const saucedemoInfo = saucedemoModule.getInfo();
    const shopifyInfo = shopifyModule.getInfo();
    
    expect(nikeInfo.siteName).toBe('nike');
    expect(targetInfo.siteName).toBe('target');
    expect(bestbuyInfo.siteName).toBe('bestbuy');
    expect(walmartInfo.siteName).toBe('walmart');
    expect(saucedemoInfo.siteName).toBe('saucedemo');
    expect(shopifyInfo.siteName).toBe('shopify');
    
    expect(nikeInfo.initialized).toBe(false);
    expect(targetInfo.initialized).toBe(false);
    expect(bestbuyInfo.initialized).toBe(false);
    expect(walmartInfo.initialized).toBe(false);
    expect(saucedemoInfo.initialized).toBe(false);
    expect(shopifyInfo.initialized).toBe(false);
  });

  test('should handle events properly', async () => {
    const module = siteModuleFactory.createModule('nike');
    
    const initializingSpy = jest.fn();
    const initializedSpy = jest.fn();
    
    module.on('initializing', initializingSpy);
    module.on('initialized', initializedSpy);
    
    await module.initialize();
    
    expect(initializingSpy).toHaveBeenCalledWith({ site: 'nike' });
    expect(initializedSpy).toHaveBeenCalledWith({ site: 'nike' });
  });

  test('should validate configuration', () => {
    const module = siteModuleFactory.createModule('nike');
    
    const validConfig = { timeout: 30000 };
    const invalidConfig = null;
    
    expect(module.validateConfig(validConfig)).toBe(true);
    expect(module.validateConfig(invalidConfig)).toBe(false);
  });

  test('should merge configuration with defaults', () => {
    const module = siteModuleFactory.createModule('nike');
    
    const customConfig = { timeout: 60000, customOption: 'test' };
    const mergedConfig = module.mergeConfig(customConfig);
    
    expect(mergedConfig.timeout).toBe(60000);
    expect(mergedConfig.customOption).toBe('test');
    expect(mergedConfig.stealthLevel).toBe('high'); // Default value
  });
});