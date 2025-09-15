const ErrorHandling = require('../../src/core/ErrorHandling');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('ErrorHandling', () => {
  let errorHandling;

  beforeEach(() => {
    errorHandling = new ErrorHandling(mockLogger);
  });

  test('should create an ErrorHandling instance', () => {
    expect(errorHandling).toBeInstanceOf(ErrorHandling);
    expect(errorHandling.logger).toBe(mockLogger);
  });

  test('should categorize network errors', () => {
    const error = new Error('Network timeout occurred');
    const category = errorHandling.categorizeError(error);
    expect(category).toBe('NETWORK_ERROR');
  });

  test('should categorize rate limit errors', () => {
    const error = new Error('Rate limit exceeded (429)');
    const category = errorHandling.categorizeError(error);
    expect(category).toBe('RATE_LIMIT_ERROR');
  });

  test('should categorize selector errors', () => {
    const error = new Error('Element not found: #nonexistent');
    const category = errorHandling.categorizeError(error);
    expect(category).toBe('SELECTOR_ERROR');
  });

  test('should categorize CAPTCHA errors', () => {
    const error = new Error('CAPTCHA challenge detected');
    const category = errorHandling.categorizeError(error);
    expect(category).toBe('CAPTCHA_ERROR');
  });

  test('should handle errors with recovery strategies', async () => {
    const error = new Error('Network timeout');
    const context = { page: 'test-page' };
    
    const result = await errorHandling.handleError(error, context);
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('strategy');
    expect(result.strategy).toBe('BACKOFF');
  }, 10000); // Increase timeout for this test

  test('should apply exponential backoff', () => {
    const delay = errorHandling.calculateExponentialBackoff(2, 1000);
    expect(delay).toBeGreaterThanOrEqual(4000); // 1000 * 2^2 = 4000
    expect(delay).toBeLessThanOrEqual(5000); // Plus jitter
  });

  test('should track error counts', async () => {
    const error = new Error('Network timeout');
    
    await errorHandling.handleError(error);
    await errorHandling.handleError(error);
    
    const counts = errorHandling.getErrorCounts();
    expect(counts.get('NETWORK_ERROR')).toBe(2);
  }, 10000); // Increase timeout for this test

  test('should generate error reports', () => {
    // Manually set some error counts
    errorHandling.errorCounts.set('NETWORK_ERROR', 3);
    errorHandling.errorCounts.set('SELECTOR_ERROR', 1);
    
    const report = errorHandling.generateErrorReport();
    
    expect(report).toHaveProperty('totalErrors', 4);
    expect(report.errorCounts).toHaveProperty('NETWORK_ERROR', 3);
    expect(report.errorCounts).toHaveProperty('SELECTOR_ERROR', 1);
  });
});