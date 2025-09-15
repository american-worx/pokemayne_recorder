const {
  humanLikeDelay,
  typingDelay,
  isElementStable,
  humanLikeFill,
  humanLikeClick,
  waitForCondition,
  getRandomUserAgent,
  getRandomViewport
} = require('../../src/modules/CommonUtils');

describe('CommonUtils', () => {
  test('should generate human-like delay', async () => {
    const startTime = Date.now();
    await humanLikeDelay(100, 0.1); // 100ms with 10% variance
    const endTime = Date.now();
    
    // Should be close to 100ms (within 10% variance)
    const actualDelay = endTime - startTime;
    expect(actualDelay).toBeGreaterThanOrEqual(90);
    expect(actualDelay).toBeLessThanOrEqual(110);
  });

  test('should generate typing delay', async () => {
    const startTime = Date.now();
    await typingDelay('Hello world', 60, 0.1); // 60 WPM with 10% variance
    const endTime = Date.now();
    
    // Should take some time (exact time depends on implementation)
    const actualTime = endTime - startTime;
    expect(actualTime).toBeGreaterThan(0);
  });

  test('should generate random user agent', () => {
    const userAgent1 = getRandomUserAgent();
    const userAgent2 = getRandomUserAgent();
    
    expect(typeof userAgent1).toBe('string');
    expect(userAgent1.length).toBeGreaterThan(0);
    // Note: They might be the same due to randomness, but usually different
  });

  test('should generate random viewport', () => {
    const viewport1 = getRandomViewport();
    const viewport2 = getRandomViewport();
    
    expect(viewport1).toHaveProperty('width');
    expect(viewport1).toHaveProperty('height');
    expect(typeof viewport1.width).toBe('number');
    expect(typeof viewport1.height).toBe('number');
  });

  test('should wait for condition with retries', async () => {
    let callCount = 0;
    
    const conditionFn = () => {
      callCount++;
      if (callCount >= 3) {
        return true;
      }
      return false;
    };
    
    const result = await waitForCondition(conditionFn, {
      maxRetries: 5,
      initialDelay: 10
    });
    
    expect(result).toBe(true);
    expect(callCount).toBe(3);
  });

  test('should fail condition after max retries', async () => {
    const conditionFn = () => false;
    
    const result = await waitForCondition(conditionFn, {
      maxRetries: 2,
      initialDelay: 10
    });
    
    expect(result).toBe(false);
  });

  test('should handle condition function that throws', async () => {
    let callCount = 0;
    
    const conditionFn = () => {
      callCount++;
      if (callCount >= 3) {
        return true;
      }
      throw new Error('Temporary error');
    };
    
    const result = await waitForCondition(conditionFn, {
      maxRetries: 5,
      initialDelay: 10
    });
    
    expect(result).toBe(true);
    expect(callCount).toBe(3);
  });
});