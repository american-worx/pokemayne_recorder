const SauceDemoModule = require('../../src/modules/SauceDemoModule');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('SauceDemo Module Compatibility Tests', () => {
  let sauceDemoModule;

  beforeEach(() => {
    sauceDemoModule = new SauceDemoModule({}, mockLogger);
  });

  test('should create SauceDemoModule instance', () => {
    expect(sauceDemoModule).toBeInstanceOf(SauceDemoModule);
    expect(sauceDemoModule.siteName).toBe('saucedemo');
    expect(sauceDemoModule.version).toBe('1.0.0');
    expect(sauceDemoModule.initialized).toBe(false);
  });

  test('should initialize SauceDemoModule', async () => {
    expect(sauceDemoModule.initialized).toBe(false);
    
    // Test initialization events
    const initializingSpy = jest.fn();
    const initializedSpy = jest.fn();
    
    sauceDemoModule.on('initializing', initializingSpy);
    sauceDemoModule.on('initialized', initializedSpy);
    
    await sauceDemoModule.initialize();
    
    expect(sauceDemoModule.initialized).toBe(true);
    expect(initializingSpy).toHaveBeenCalledWith({ site: 'saucedemo' });
    expect(initializedSpy).toHaveBeenCalledWith({ site: 'saucedemo' });
  });

  test('should generate test data', () => {
    const testData = sauceDemoModule.generateTestData();
    
    expect(testData).toBeDefined();
    expect(typeof testData.username).toBe('string');
    expect(typeof testData.password).toBe('string');
    expect(typeof testData.firstName).toBe('string');
    expect(typeof testData.lastName).toBe('string');
    expect(typeof testData.postalCode).toBe('string');
    
    expect(testData.username).toBe('standard_user');
    expect(testData.password).toBe('secret_sauce');
  });

  test('should validate checkout result', () => {
    const successResult = {
      success: true,
      stepsExecuted: 5
    };
    
    const validationResult = sauceDemoModule.validateCheckoutResult(successResult);
    
    expect(validationResult).toBeDefined();
    expect(typeof validationResult.valid).toBe('boolean');
    expect(typeof validationResult.stepsCompleted).toBe('number');
    expect(typeof validationResult.expectedSteps).toBe('number');
    expect(typeof validationResult.timestamp).toBe('string');
    
    expect(validationResult.stepsCompleted).toBe(5);
    expect(validationResult.expectedSteps).toBe(5);
  });

  test('should handle invalid checkout result', () => {
    const failedResult = {
      success: false,
      stepsExecuted: 3
    };
    
    const validationResult = sauceDemoModule.validateCheckoutResult(failedResult);
    
    expect(validationResult.valid).toBe(false);
    expect(validationResult.stepsCompleted).toBe(3);
    expect(validationResult.expectedSteps).toBe(5);
  });

  test('should get module information', () => {
    const info = sauceDemoModule.getInfo();
    
    expect(info.siteName).toBe('saucedemo');
    expect(info.version).toBe('1.0.0');
    expect(info.initialized).toBe(false);
    expect(typeof info.config).toBe('object');
  });

  test('should validate configuration', () => {
    const validConfig = { timeout: 30000 };
    const invalidConfig = null;
    
    expect(sauceDemoModule.validateConfig(validConfig)).toBe(true);
    expect(sauceDemoModule.validateConfig(invalidConfig)).toBe(false);
  });

  test('should merge configuration with defaults', () => {
    const customConfig = { timeout: 45000, customOption: 'test' };
    const mergedConfig = sauceDemoModule.mergeConfig(customConfig);
    
    expect(mergedConfig.timeout).toBe(45000);
    expect(mergedConfig.customOption).toBe('test');
    expect(mergedConfig.stealthLevel).toBe('high'); // Default value
    expect(mergedConfig.maxRetries).toBe(3); // Default value
  });
});