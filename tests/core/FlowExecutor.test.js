const FlowExecutor = require('../../src/core/FlowExecutor');
const winston = require('winston');

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

// Mock page object for testing
const mockPage = {
  goto: jest.fn(),
  click: jest.fn(),
  fill: jest.fn(),
  waitForSelector: jest.fn(),
  waitForTimeout: jest.fn(),
  screenshot: jest.fn()
};

describe('FlowExecutor', () => {
  let flowExecutor;

  beforeEach(() => {
    flowExecutor = new FlowExecutor(mockLogger);
    jest.clearAllMocks();
  });

  test('should create a FlowExecutor instance', () => {
    expect(flowExecutor).toBeInstanceOf(FlowExecutor);
    expect(flowExecutor.logger).toBe(mockLogger);
  });

  test('should emit progress events during execution', async () => {
    const flowConfig = {
      site: 'test',
      steps: [
        { action: 'goto', url: 'https://example.com' },
        { action: 'click', selector: '#button' }
      ]
    };

    // Mock the execution methods
    flowExecutor.executeGoto = jest.fn();
    flowExecutor.executeClick = jest.fn();

    // Set up event listeners
    const progressSpy = jest.fn();
    const startSpy = jest.fn();
    const completeSpy = jest.fn();

    flowExecutor.on('progress', progressSpy);
    flowExecutor.on('start', startSpy);
    flowExecutor.on('complete', completeSpy);

    // Execute the flow
    const result = await flowExecutor.executeFlow(mockPage, flowConfig, {});

    // Verify events were emitted
    expect(startSpy).toHaveBeenCalledWith({ totalSteps: 2 });
    expect(progressSpy).toHaveBeenCalledTimes(2);
    expect(progressSpy).toHaveBeenNthCalledWith(1, {
      currentStep: 1,
      totalSteps: 2,
      action: 'goto',
      description: undefined
    });
    expect(progressSpy).toHaveBeenNthCalledWith(2, {
      currentStep: 2,
      totalSteps: 2,
      action: 'click',
      description: undefined
    });
    expect(completeSpy).toHaveBeenCalledWith({
      success: true,
      duration: expect.any(Number),
      completedSteps: 2,
      failedSteps: 0
    });

    // Verify result
    expect(result.success).toBe(true);
    expect(result.completedSteps).toBe(2);
  });

  test('should emit error event on failure', async () => {
    const flowConfig = {
      site: 'test',
      steps: [
        { action: 'invalid-action' }
      ],
      options: {
        maxRetries: 0 // Disable retries for faster testing
      }
    };

    const errorSpy = jest.fn();
    flowExecutor.on('error', errorSpy);

    // Execute the flow (should fail)
    const result = await flowExecutor.executeFlow(mockPage, flowConfig, {});

    // Verify error event was emitted
    expect(errorSpy).toHaveBeenCalledWith({
      error: expect.any(String),
      duration: expect.any(Number),
      failedSteps: expect.any(Number)
    });

    // Verify result
    expect(result.success).toBe(false);
  }, 10000); // Increase timeout for this test

  test('should substitute variables in steps', () => {
    const step = {
      action: 'fill',
      selector: '#email',
      value: '{email}'
    };

    const variables = {
      email: 'test@example.com'
    };

    const processedStep = flowExecutor.substituteVariables(step, variables);
    
    expect(processedStep.value).toBe('test@example.com');
  });

  test('should calculate exponential backoff delay', () => {
    // Test a few retry counts
    const delay1 = flowExecutor.calculateBackoffDelay(0);
    const delay2 = flowExecutor.calculateBackoffDelay(1);
    const delay3 = flowExecutor.calculateBackoffDelay(2);
    
    // Each delay should be reasonable
    expect(delay1).toBeGreaterThanOrEqual(1000);
    expect(delay1).toBeLessThanOrEqual(2000); // Account for jitter
    
    expect(delay2).toBeGreaterThanOrEqual(1000);
    expect(delay2).toBeLessThanOrEqual(4000); // Account for jitter
    
    expect(delay3).toBeGreaterThanOrEqual(1000);
    expect(delay3).toBeLessThanOrEqual(8000); // Account for jitter
    
    // Should have a maximum limit
    const maxDelay = flowExecutor.calculateBackoffDelay(20);
    expect(maxDelay).toBeLessThanOrEqual(30000);
  });

  test('should reset execution state', () => {
    // Set some state
    flowExecutor.executionState.completedSteps = [1, 2, 3];
    flowExecutor.executionState.currentStep = 3;
    
    // Reset
    flowExecutor.reset();
    
    // Verify reset
    expect(flowExecutor.executionState.completedSteps).toEqual([]);
    expect(flowExecutor.executionState.currentStep).toBe(0);
  });
});