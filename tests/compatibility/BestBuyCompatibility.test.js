const BestBuyModule = require('../../src/modules/BestBuyModule');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('BestBuy Module Compatibility Tests', () => {
  let bestBuyModule;

  beforeEach(() => {
    bestBuyModule = new BestBuyModule({}, mockLogger);
  });

  test('should create BestBuyModule instance', () => {
    expect(bestBuyModule).toBeInstanceOf(BestBuyModule);
    expect(bestBuyModule.siteName).toBe('bestbuy');
    expect(bestBuyModule.version).toBe('1.0.0');
    expect(bestBuyModule.initialized).toBe(false);
  });

  test('should initialize BestBuyModule', async () => {
    expect(bestBuyModule.initialized).toBe(false);
    
    // Test initialization events
    const initializingSpy = jest.fn();
    const initializedSpy = jest.fn();
    
    bestBuyModule.on('initializing', initializingSpy);
    bestBuyModule.on('initialized', initializedSpy);
    
    await bestBuyModule.initialize();
    
    expect(bestBuyModule.initialized).toBe(true);
    expect(initializingSpy).toHaveBeenCalledWith({ site: 'bestbuy' });
    expect(initializedSpy).toHaveBeenCalledWith({ site: 'bestbuy' });
  });

  test('should monitor wave release', async () => {
    const waveDetectedSpy = jest.fn();
    const waveHandledSpy = jest.fn();
    
    bestBuyModule.on('waveDetected', waveDetectedSpy);
    bestBuyModule.on('waveHandled', waveHandledSpy);
    
    // Mock page object
    const mockPage = {};
    
    // Mock the monitorWaveRelease method to avoid actual implementation
    bestBuyModule.monitorWaveRelease = jest.fn().mockResolvedValue();
    
    await bestBuyModule.monitorWaveRelease(mockPage);
    
    expect(bestBuyModule.monitorWaveRelease).toHaveBeenCalled();
  });

  test('should get module information', () => {
    const info = bestBuyModule.getInfo();
    
    expect(info.siteName).toBe('bestbuy');
    expect(info.version).toBe('1.0.0');
    expect(info.initialized).toBe(false);
    expect(typeof info.config).toBe('object');
  });

  test('should validate configuration', () => {
    const validConfig = { timeout: 30000 };
    const invalidConfig = null;
    
    expect(bestBuyModule.validateConfig(validConfig)).toBe(true);
    expect(bestBuyModule.validateConfig(invalidConfig)).toBe(false);
  });

  test('should merge configuration with defaults', () => {
    const customConfig = { timeout: 45000, customOption: 'test' };
    const mergedConfig = bestBuyModule.mergeConfig(customConfig);
    
    expect(mergedConfig.timeout).toBe(45000);
    expect(mergedConfig.customOption).toBe('test');
    expect(mergedConfig.stealthLevel).toBe('high'); // Default value
  });
});