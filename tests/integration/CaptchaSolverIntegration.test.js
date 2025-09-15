const {
  CaptchaSolverManager,
  TwoCaptchaSolver,
  AntiCaptchaSolver
} = require('../../src/core/CaptchaSolver');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('Captcha Solver Integration', () => {
  let captchaSolverManager;

  beforeEach(() => {
    captchaSolverManager = new CaptchaSolverManager(mockLogger);
  });

  test('should integrate multiple CAPTCHA solvers', () => {
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    const antiCaptcha = new AntiCaptchaSolver(mockLogger);
    
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    captchaSolverManager.addSolver('anticaptcha', antiCaptcha);
    
    const stats = captchaSolverManager.getStats();
    expect(stats.availableServices).toHaveLength(2);
    expect(stats.availableServices).toContain('2captcha');
    expect(stats.availableServices).toContain('anticaptcha');
  });

  test('should set API keys for solvers', () => {
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    const antiCaptcha = new AntiCaptchaSolver(mockLogger);
    
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    captchaSolverManager.addSolver('anticaptcha', antiCaptcha);
    
    captchaSolverManager.setApiKey('2captcha', 'test-key-1');
    captchaSolverManager.setApiKey('anticaptcha', 'test-key-2');
    
    expect(twoCaptcha.apiKey).toBe('test-key-1');
    expect(antiCaptcha.apiKey).toBe('test-key-2');
  });

  test('should get solver statistics', () => {
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    const antiCaptcha = new AntiCaptchaSolver(mockLogger);
    
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    captchaSolverManager.addSolver('anticaptcha', antiCaptcha);
    
    // Simulate some usage
    captchaSolverManager.stats.serviceUsage['2captcha'] = {
      solved: 5,
      failed: 1,
      avgResponseTime: 3000
    };
    
    captchaSolverManager.stats.serviceUsage['anticaptcha'] = {
      solved: 3,
      failed: 2,
      avgResponseTime: 4500
    };
    
    captchaSolverManager.stats.totalSolved = 8;
    captchaSolverManager.stats.totalFailed = 3;
    
    const stats = captchaSolverManager.getStats();
    
    expect(stats.totalSolved).toBe(8);
    expect(stats.totalFailed).toBe(3);
    expect(stats.successRate).toBe(8/11);
    expect(stats.serviceUsage['2captcha'].solved).toBe(5);
    expect(stats.serviceUsage['anticaptcha'].avgResponseTime).toBe(4500);
  });

  test('should determine best solver based on performance', () => {
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    const antiCaptcha = new AntiCaptchaSolver(mockLogger);
    
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    captchaSolverManager.addSolver('anticaptcha', antiCaptcha);
    
    // Set up performance data
    // 2Captcha: 10 solved, 2 failed (83.3% success), avg 2000ms
    captchaSolverManager.stats.serviceUsage['2captcha'] = {
      solved: 10,
      failed: 2,
      avgResponseTime: 2000
    };
    
    // AntiCaptcha: 8 solved, 2 failed (80% success), avg 1500ms
    captchaSolverManager.stats.serviceUsage['anticaptcha'] = {
      solved: 8,
      failed: 2,
      avgResponseTime: 1500
    };
    
    const bestSolver = captchaSolverManager.getBestSolver();
    // Should prefer 2Captcha due to higher success rate despite slower response time
    expect(bestSolver).toBe(twoCaptcha);
  });

  test('should handle solver with no usage data', () => {
    const twoCaptcha = new TwoCaptchaSolver(mockLogger);
    const antiCaptcha = new AntiCaptchaSolver(mockLogger);
    
    captchaSolverManager.addSolver('2captcha', twoCaptcha);
    captchaSolverManager.addSolver('anticaptcha', antiCaptcha);
    
    // Only set up data for 2Captcha
    captchaSolverManager.stats.serviceUsage['2captcha'] = {
      solved: 5,
      failed: 1,
      avgResponseTime: 3000
    };
    
    const bestSolver = captchaSolverManager.getBestSolver();
    // Should prefer 2Captcha since it has usage data
    expect(bestSolver).toBe(twoCaptcha);
  });

  test('should return null when no solvers configured', () => {
    const bestSolver = captchaSolverManager.getBestSolver();
    expect(bestSolver).toBeNull();
  });
});