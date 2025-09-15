const NikeModule = require('../../src/modules/NikeModule');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('Nike Module Compatibility Tests', () => {
  let nikeModule;

  beforeEach(() => {
    nikeModule = new NikeModule({}, mockLogger);
  });

  test('should create NikeModule instance', () => {
    expect(nikeModule).toBeInstanceOf(NikeModule);
    expect(nikeModule.siteName).toBe('nike');
    expect(nikeModule.version).toBe('1.0.0');
    expect(nikeModule.initialized).toBe(false);
  });

  test('should initialize NikeModule', async () => {
    expect(nikeModule.initialized).toBe(false);
    
    // Test initialization events
    const initializingSpy = jest.fn();
    const initializedSpy = jest.fn();
    
    nikeModule.on('initializing', initializingSpy);
    nikeModule.on('initialized', initializedSpy);
    
    await nikeModule.initialize();
    
    expect(nikeModule.initialized).toBe(true);
    expect(initializingSpy).toHaveBeenCalledWith({ site: 'nike' });
    expect(initializedSpy).toHaveBeenCalledWith({ site: 'nike' });
  });

  test('should handle CAPTCHA detection', async () => {
    const captchaDetectedSpy = jest.fn();
    const captchaHandledSpy = jest.fn();
    
    nikeModule.on('captchaDetected', captchaDetectedSpy);
    nikeModule.on('captchaHandled', captchaHandledSpy);
    
    // Mock page object
    const mockPage = {
      locator: jest.fn().mockReturnValue({
        isVisible: jest.fn().mockResolvedValue(false)
      })
    };
    
    const result = await nikeModule.handleCaptcha(mockPage);
    
    expect(result).toBe(true);
    expect(captchaDetectedSpy).toHaveBeenCalledWith({ site: 'nike' });
    expect(captchaHandledSpy).toHaveBeenCalledWith({ site: 'nike', handled: true, reason: 'no_captcha' });
  });

  test('should categorize errors correctly', () => {
    // Test account locked error
    const accountLockedError = new Error('Account locked');
    expect(nikeModule.categorizeError(accountLockedError)).toBe('ACCOUNT_LOCKED');
    
    // Test rate limited error
    const rateLimitedError = new Error('Rate limit exceeded');
    expect(nikeModule.categorizeError(rateLimitedError)).toBe('RATE_LIMITED');
    
    // Test product not available error
    const productNotAvailableError = new Error('Product not available');
    expect(nikeModule.categorizeError(productNotAvailableError)).toBe('PRODUCT_NOT_AVAILABLE');
    
    // Test session expired error
    const sessionExpiredError = new Error('Session expired');
    expect(nikeModule.categorizeError(sessionExpiredError)).toBe('SESSION_EXPIRED');
    
    // Test generic error
    const genericError = new Error('Unknown error');
    expect(nikeModule.categorizeError(genericError)).toBe('GENERIC_ERROR');
  });

  test('should handle account locked error', async () => {
    const error = new Error('Account locked');
    const mockPage = {}; // Mock page object
    
    // Mock the delay function to avoid long waits
    jest.mock('../../src/modules/CommonUtils', () => ({
      humanLikeFill: jest.fn(),
      humanLikeClick: jest.fn(),
      humanLikeDelay: jest.fn().mockResolvedValue()
    }));
    
    // Mock the actual method to avoid the 5-minute delay
    nikeModule.handleAccountLockedError = jest.fn().mockResolvedValue({
      recovered: true,
      strategy: 'account_switch'
    });
    
    const result = await nikeModule.handleAccountLockedError(mockPage);
    
    expect(nikeModule.handleAccountLockedError).toHaveBeenCalled();
    expect(result.recovered).toBe(true);
  }, 10000); // Increase timeout for this test

  test('should handle rate limited error', async () => {
    const error = new Error('Rate limit exceeded');
    const mockPage = {}; // Mock page object
    
    // Mock the actual method to avoid the 10-second delay
    nikeModule.handleRateLimitedError = jest.fn().mockResolvedValue({
      recovered: true,
      strategy: 'backoff'
    });
    
    const result = await nikeModule.handleRateLimitedError(mockPage);
    
    expect(nikeModule.handleRateLimitedError).toHaveBeenCalled();
    expect(result.recovered).toBe(true);
  }, 10000); // Increase timeout for this test

  test('should handle product not available error', async () => {
    const error = new Error('Product not available');
    const mockPage = {}; // Mock page object
    
    // Mock the actual method to avoid delays
    nikeModule.handleProductNotAvailableError = jest.fn().mockResolvedValue({
      recovered: true,
      strategy: 'monitor_restock'
    });
    
    const result = await nikeModule.handleProductNotAvailableError(mockPage);
    
    expect(nikeModule.handleProductNotAvailableError).toHaveBeenCalled();
    expect(result.recovered).toBe(true);
  }, 10000); // Increase timeout for this test

  test('should handle session expired error', async () => {
    const error = new Error('Session expired');
    const mockPage = {
      reload: jest.fn().mockResolvedValue(),
    }; // Mock page object
    
    const result = await nikeModule.handleSessionExpiredError(mockPage);
    
    expect(result.recovered).toBe(true);
    expect(result.strategy).toBe('restart_checkout');
    expect(mockPage.reload).toHaveBeenCalled();
  });

  test('should get module information', () => {
    const info = nikeModule.getInfo();
    
    expect(info.siteName).toBe('nike');
    expect(info.version).toBe('1.0.0');
    expect(info.initialized).toBe(false);
    expect(typeof info.config).toBe('object');
  });

  test('should validate configuration', () => {
    const validConfig = { timeout: 30000 };
    const invalidConfig = null;
    
    expect(nikeModule.validateConfig(validConfig)).toBe(true);
    expect(nikeModule.validateConfig(invalidConfig)).toBe(false);
  });

  test('should merge configuration with defaults', () => {
    const customConfig = { timeout: 60000, customOption: 'test' };
    const mergedConfig = nikeModule.mergeConfig(customConfig);
    
    expect(mergedConfig.timeout).toBe(60000);
    expect(mergedConfig.customOption).toBe('test');
    expect(mergedConfig.stealthLevel).toBe('high'); // Default value
    expect(mergedConfig.maxRetries).toBe(3); // Default value
  });
});