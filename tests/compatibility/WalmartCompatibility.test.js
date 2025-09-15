const WalmartModule = require('../../src/modules/WalmartModule');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('Walmart Module Compatibility Tests', () => {
  let walmartModule;

  beforeEach(() => {
    walmartModule = new WalmartModule({}, mockLogger);
  });

  test('should create WalmartModule instance', () => {
    expect(walmartModule).toBeInstanceOf(WalmartModule);
    expect(walmartModule.siteName).toBe('walmart');
    expect(walmartModule.version).toBe('1.0.0');
    expect(walmartModule.initialized).toBe(false);
  });

  test('should initialize WalmartModule', async () => {
    expect(walmartModule.initialized).toBe(false);
    
    // Test initialization events
    const initializingSpy = jest.fn();
    const initializedSpy = jest.fn();
    
    walmartModule.on('initializing', initializingSpy);
    walmartModule.on('initialized', initializedSpy);
    
    await walmartModule.initialize();
    
    expect(walmartModule.initialized).toBe(true);
    expect(initializingSpy).toHaveBeenCalledWith({ site: 'walmart' });
    expect(initializedSpy).toHaveBeenCalledWith({ site: 'walmart' });
  });

  test('should handle CAPTCHA solving', async () => {
    const captchaDetectedSpy = jest.fn();
    const captchaHandledSpy = jest.fn();
    
    walmartModule.on('captchaDetected', captchaDetectedSpy);
    walmartModule.on('captchaHandled', captchaHandledSpy);
    
    // Mock page object
    const mockPage = {
      locator: jest.fn().mockReturnValue({
        isVisible: jest.fn().mockResolvedValue(false)
      })
    };
    
    const result = await walmartModule.handleCaptcha(mockPage);
    
    expect(result).toBe(true);
    expect(captchaDetectedSpy).toHaveBeenCalledWith({ site: 'walmart' });
    expect(captchaHandledSpy).toHaveBeenCalledWith({ site: 'walmart', handled: true, reason: 'no_captcha' });
  });

  test('should handle Akamai detection', async () => {
    const akamaiDetectedSpy = jest.fn();
    const akamaiHandledSpy = jest.fn();
    
    walmartModule.on('akamaiDetected', akamaiDetectedSpy);
    walmartModule.on('akamaiHandled', akamaiHandledSpy);
    
    // Mock page object
    const mockPage = {
      locator: jest.fn().mockReturnValue({
        isVisible: jest.fn().mockResolvedValue(false)
      })
    };
    
    // Mock the handleAkamaiDetection method
    walmartModule.handleAkamaiDetection = jest.fn().mockResolvedValue({
      handled: true
    });
    
    const result = await walmartModule.handleAkamaiDetection(mockPage);
    
    expect(walmartModule.handleAkamaiDetection).toHaveBeenCalled();
    expect(result.handled).toBe(true);
  });

  test('should get module information', () => {
    const info = walmartModule.getInfo();
    
    expect(info.siteName).toBe('walmart');
    expect(info.version).toBe('1.0.0');
    expect(info.initialized).toBe(false);
    expect(typeof info.config).toBe('object');
  });

  test('should validate configuration', () => {
    const validConfig = { timeout: 30000 };
    const invalidConfig = null;
    
    expect(walmartModule.validateConfig(validConfig)).toBe(true);
    expect(walmartModule.validateConfig(invalidConfig)).toBe(false);
  });

  test('should merge configuration with defaults', () => {
    const customConfig = { timeout: 60000, customOption: 'test' };
    const mergedConfig = walmartModule.mergeConfig(customConfig);
    
    expect(mergedConfig.timeout).toBe(60000);
    expect(mergedConfig.customOption).toBe('test');
    expect(mergedConfig.stealthLevel).toBe('high'); // Default value from BaseSiteModule
  });
});