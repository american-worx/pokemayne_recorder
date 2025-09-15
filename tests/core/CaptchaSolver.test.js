const {
  CaptchaSolver,
  TwoCaptchaSolver,
  AntiCaptchaSolver,
  CaptchaSolverManager
} = require('../../src/core/CaptchaSolver');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('CaptchaSolver', () => {
  test('should create a CaptchaSolver instance', () => {
    const solver = new CaptchaSolver(mockLogger);
    expect(solver).toBeInstanceOf(CaptchaSolver);
    expect(solver.logger).toBe(mockLogger);
    expect(solver.serviceName).toBe('abstract');
  });

  test('should set API key', () => {
    const solver = new CaptchaSolver(mockLogger);
    solver.setApiKey('test-api-key');
    expect(solver.apiKey).toBe('test-api-key');
  });

  test('should throw error for unimplemented solve method', async () => {
    const solver = new CaptchaSolver(mockLogger);
    await expect(solver.solve({})).rejects.toThrow('solve method must be implemented by subclass');
  });

  test('should get statistics', () => {
    const solver = new CaptchaSolver(mockLogger);
    solver.setApiKey('test-api-key');
    
    const stats = solver.getStats();
    expect(stats).toEqual({
      serviceName: 'abstract',
      apiKeySet: true
    });
  });
});

describe('TwoCaptchaSolver', () => {
  let solver;

  beforeEach(() => {
    solver = new TwoCaptchaSolver(mockLogger);
  });

  test('should create a TwoCaptchaSolver instance', () => {
    expect(solver).toBeInstanceOf(TwoCaptchaSolver);
    expect(solver).toBeInstanceOf(CaptchaSolver);
    expect(solver.serviceName).toBe('2captcha');
    expect(solver.baseUrl).toBe('https://2captcha.com');
  });

  test('should set API key', () => {
    solver.setApiKey('test-api-key');
    expect(solver.apiKey).toBe('test-api-key');
  });

  test('should throw error when solving without API key', async () => {
    const captchaData = {
      type: 'recaptcha2',
      siteKey: 'test-site-key',
      pageUrl: 'https://example.com'
    };

    await expect(solver.solve(captchaData)).rejects.toThrow('API key not set for 2Captcha service');
  });

  test('should get method for CAPTCHA type', () => {
    expect(solver.getMethodForCaptcha('recaptcha2')).toBe('userrecaptcha');
    expect(solver.getMethodForCaptcha('recaptcha3')).toBe('userrecaptcha');
    expect(solver.getMethodForCaptcha('hcaptcha')).toBe('hcaptcha');
    expect(solver.getMethodForCaptcha('funcaptcha')).toBe('funcaptcha');
    expect(solver.getMethodForCaptcha('text')).toBe('text');
    expect(solver.getMethodForCaptcha('image')).toBe('base64');
    expect(solver.getMethodForCaptcha('unknown')).toBe('userrecaptcha');
  });
});

describe('AntiCaptchaSolver', () => {
  let solver;

  beforeEach(() => {
    solver = new AntiCaptchaSolver(mockLogger);
  });

  test('should create an AntiCaptchaSolver instance', () => {
    expect(solver).toBeInstanceOf(AntiCaptchaSolver);
    expect(solver).toBeInstanceOf(CaptchaSolver);
    expect(solver.serviceName).toBe('anticaptcha');
    expect(solver.baseUrl).toBe('https://api.anti-captcha.com');
  });

  test('should set API key', () => {
    solver.setApiKey('test-api-key');
    expect(solver.apiKey).toBe('test-api-key');
  });

  test('should throw error when solving without API key', async () => {
    const captchaData = {
      type: 'recaptcha2',
      siteKey: 'test-site-key',
      pageUrl: 'https://example.com'
    };

    await expect(solver.solve(captchaData)).rejects.toThrow('API key not set for Anti-Captcha service');
  });

  test('should get task type for CAPTCHA type', () => {
    expect(solver.getTaskTypeForCaptcha('recaptcha2')).toBe('NoCaptchaTaskProxyless');
    expect(solver.getTaskTypeForCaptcha('recaptcha3')).toBe('RecaptchaV3TaskProxyless');
    expect(solver.getTaskTypeForCaptcha('hcaptcha')).toBe('HCaptchaTaskProxyless');
    expect(solver.getTaskTypeForCaptcha('funcaptcha')).toBe('FunCaptchaTaskProxyless');
    expect(solver.getTaskTypeForCaptcha('unknown')).toBe('NoCaptchaTaskProxyless');
  });
});

describe('CaptchaSolverManager', () => {
  let manager;

  beforeEach(() => {
    manager = new CaptchaSolverManager(mockLogger);
  });

  test('should create a CaptchaSolverManager instance', () => {
    expect(manager).toBeInstanceOf(CaptchaSolverManager);
    expect(manager.logger).toBe(mockLogger);
    expect(manager.solvers).toBeInstanceOf(Map);
    expect(manager.stats).toEqual({
      totalSolved: 0,
      totalFailed: 0,
      serviceUsage: {}
    });
  });

  test('should add solver', () => {
    const solver = new TwoCaptchaSolver(mockLogger);
    manager.addSolver('2captcha', solver);
    
    expect(manager.solvers.size).toBe(1);
    expect(manager.solvers.get('2captcha')).toBe(solver);
    expect(manager.stats.serviceUsage['2captcha']).toEqual({
      solved: 0,
      failed: 0,
      avgResponseTime: 0
    });
  });

  test('should set API key for solver', () => {
    const solver = new TwoCaptchaSolver(mockLogger);
    manager.addSolver('2captcha', solver);
    manager.setApiKey('2captcha', 'test-api-key');
    
    expect(solver.apiKey).toBe('test-api-key');
  });

  test('should get statistics', () => {
    const stats = manager.getStats();
    expect(stats).toEqual({
      totalSolved: 0,
      totalFailed: 0,
      successRate: 0,
      serviceUsage: {},
      availableServices: []
    });
  });

  test('should get best solver', () => {
    const solver1 = new TwoCaptchaSolver(mockLogger);
    const solver2 = new AntiCaptchaSolver(mockLogger);
    
    manager.addSolver('2captcha', solver1);
    manager.addSolver('anticaptcha', solver2);
    
    const bestSolver = manager.getBestSolver();
    expect(bestSolver).toBe(solver1); // First one added since no stats yet
    
    // Update stats to make solver2 better
    manager.stats.serviceUsage['2captcha'] = { solved: 5, failed: 5, avgResponseTime: 1000 };
    manager.stats.serviceUsage['anticaptcha'] = { solved: 8, failed: 2, avgResponseTime: 800 };
    
    const bestSolver2 = manager.getBestSolver();
    expect(bestSolver2).toBe(solver2); // anticaptcha should be better now
  });

  test('should throw error when no solvers configured', async () => {
    const captchaData = {
      type: 'recaptcha2',
      siteKey: 'test-site-key',
      pageUrl: 'https://example.com'
    };

    await expect(manager.solveCaptcha(captchaData)).rejects.toThrow('No CAPTCHA solvers configured');
  });
});