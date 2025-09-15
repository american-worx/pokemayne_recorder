const SiteModuleFactory = require('../../src/modules/SiteModuleFactory');
const BaseSiteModule = require('../../src/modules/BaseSiteModule');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('SiteModuleFactory', () => {
  let siteModuleFactory;

  beforeEach(() => {
    siteModuleFactory = new SiteModuleFactory(mockLogger);
  });

  test('should create a SiteModuleFactory instance', () => {
    expect(siteModuleFactory).toBeInstanceOf(SiteModuleFactory);
    expect(siteModuleFactory.logger).toBe(mockLogger);
    expect(siteModuleFactory.modules).toBeInstanceOf(Map);
    expect(siteModuleFactory.modulePaths).toBeInstanceOf(Map);
  });

  test('should create a base site module when specific module not found', () => {
    const module = siteModuleFactory.createModule('nonexistent');
    
    expect(module).toBeInstanceOf(BaseSiteModule);
    expect(module.siteName).toBe('base');
  });

  test('should get supported sites', () => {
    const sites = siteModuleFactory.getSupportedSites();
    
    expect(Array.isArray(sites)).toBe(true);
    expect(sites.includes('nike')).toBe(true);
    expect(sites.includes('target')).toBe(true);
    expect(sites.includes('bestbuy')).toBe(true);
  });

  test('should register a custom module', () => {
    class CustomModule {
      constructor(config, logger) {
        this.config = config;
        this.logger = logger;
      }
    }

    siteModuleFactory.registerModule('custom', CustomModule);
    
    const module = siteModuleFactory.createModule('custom');
    expect(module).toBeInstanceOf(CustomModule);
  });

  test('should discover modules', async () => {
    const modules = await siteModuleFactory.discoverModules();
    
    expect(Array.isArray(modules)).toBe(true);
  });

  test('should validate a module', () => {
    class ValidModule extends BaseSiteModule {
      constructor(config, logger) {
        super(config, logger);
      }
      
      async initialize() {}
      async executeCheckout() {}
      async recordFlow() {}
      async handleCaptcha() {}
      async handleError() {}
    }
    
    expect(siteModuleFactory.validateModule(ValidModule)).toBe(true);
  });

  test('should get module info', () => {
    class TestModule extends BaseSiteModule {
      constructor(config, logger) {
        super(config, logger);
      }
    }
    
    siteModuleFactory.registerModule('test', TestModule);
    const info = siteModuleFactory.getModuleInfo('test');
    
    expect(info).toBeDefined();
    expect(info.siteName).toBe('test');
  });

  test('should return null for non-existent module info', () => {
    const info = siteModuleFactory.getModuleInfo('nonexistent');
    
    expect(info).toBeNull();
  });
});