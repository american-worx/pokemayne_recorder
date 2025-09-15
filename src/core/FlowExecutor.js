const winston = require('winston');
const { EventEmitter } = require('events');

/**
 * FlowExecutor - Executes recorded checkout flows
 */
class FlowExecutor extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.executionState = {
      currentStep: 0,
      completedSteps: [],
      failedSteps: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Execute a checkout flow
   * @param {Page} page - Playwright page instance
   * @param {Object} flowConfig - Flow configuration
   * @param {Object} variables - Variables to substitute in the flow
   * @returns {Object} - Execution result
   */
  async executeFlow(page, flowConfig, variables = {}) {
    this.logger.info('Starting flow execution', { 
      site: flowConfig.site, 
      steps: flowConfig.steps.length 
    });

    this.executionState.startTime = new Date();
    this.executionState.currentStep = 0;
    this.executionState.completedSteps = [];
    this.executionState.failedSteps = [];

    try {
      // Emit start event
      this.emit('start', { totalSteps: flowConfig.steps.length });

      // Execute each step in the flow
      for (let i = 0; i < flowConfig.steps.length; i++) {
        const step = flowConfig.steps[i];
        this.executionState.currentStep = i;

        this.logger.info('Executing step', { 
          step: i + 1, 
          action: step.action,
          description: step.description
        });

        // Emit progress event
        this.emit('progress', { 
          currentStep: i + 1, 
          totalSteps: flowConfig.steps.length,
          action: step.action,
          description: step.description
        });

        // Calculate max retries for this step
        const maxRetries = step.options?.maxRetries ?? flowConfig.options?.maxRetries ?? 3;
        let retryCount = 0;
        let stepSuccess = false;

        while (!stepSuccess && retryCount <= maxRetries) {
          try {
            if (retryCount > 0) {
              this.logger.info('Retrying step', { 
                step: i + 1, 
                retry: retryCount,
                maxRetries
              });
              
              // Apply exponential backoff
              const delay = this.calculateBackoffDelay(retryCount);
              await this.sleep(delay);
            }

            await this.executeStep(page, step, variables);
            this.executionState.completedSteps.push(i);
            this.logger.info('Step completed successfully', { step: i + 1 });
            stepSuccess = true;
          } catch (error) {
            retryCount++;
            
            this.executionState.failedSteps.push({ 
              step: i, 
              attempt: retryCount,
              error: error.message,
              timestamp: Date.now()
            });
            
            this.logger.error('Step failed', { 
              step: i + 1, 
              attempt: retryCount,
              error: error.message,
              stack: error.stack
            });

            // If we've exhausted retries, rethrow the error
            if (retryCount > maxRetries) {
              throw error;
            }
          }
        }
      }

      this.executionState.endTime = new Date();
      const duration = this.executionState.endTime - this.executionState.startTime;

      // Emit completion event
      this.emit('complete', { 
        success: this.executionState.failedSteps.length === 0,
        duration,
        completedSteps: this.executionState.completedSteps.length,
        failedSteps: this.executionState.failedSteps.length
      });

      this.logger.info('Flow execution completed', { 
        duration: `${duration}ms`,
        completedSteps: this.executionState.completedSteps.length,
        failedSteps: this.executionState.failedSteps.length
      });

      return {
        success: this.executionState.failedSteps.length === 0,
        duration,
        completedSteps: this.executionState.completedSteps.length,
        failedSteps: this.executionState.failedSteps.length,
        executionState: this.executionState
      };
    } catch (error) {
      this.executionState.endTime = new Date();
      const duration = this.executionState.endTime - this.executionState.startTime;
      
      // Emit error event
      this.emit('error', { 
        error: error.message,
        duration,
        failedSteps: this.executionState.failedSteps.length
      });

      this.logger.error('Flow execution failed', { 
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        failedSteps: this.executionState.failedSteps.length,
        duration,
        executionState: this.executionState
      };
    }
  }

  /**
   * Execute a single step in the flow
   * @param {Page} page - Playwright page instance
   * @param {Object} step - Step configuration
   * @param {Object} variables - Variables to substitute
   */
  async executeStep(page, step, variables) {
    // Substitute variables in the step
    const processedStep = this.substituteVariables(step, variables);

    // Execute based on action type
    switch (processedStep.action) {
      case 'goto':
        await this.executeGoto(page, processedStep);
        break;
      case 'click':
        await this.executeClick(page, processedStep);
        break;
      case 'fill':
        await this.executeFill(page, processedStep);
        break;
      case 'waitForSelector':
        await this.executeWaitForSelector(page, processedStep);
        break;
      case 'waitForTimeout':
        await this.executeWaitForTimeout(page, processedStep);
        break;
      case 'screenshot':
        await this.executeScreenshot(page, processedStep);
        break;
      default:
        throw new Error(`Unsupported action: ${processedStep.action}`);
    }
  }

  /**
   * Execute goto action
   * @param {Page} page - Playwright page instance
   * @param {Object} step - Step configuration
   */
  async executeGoto(page, step) {
    const url = step.url;
    const options = step.options || { waitUntil: 'networkidle' };
    
    this.logger.debug('Navigating to URL', { url });
    await page.goto(url, options);
  }

  /**
   * Execute click action
   * @param {Page} page - Playwright page instance
   * @param {Object} step - Step configuration
   */
  async executeClick(page, step) {
    const selector = step.selector;
    const options = step.options || {};
    
    this.logger.debug('Clicking element', { selector });
    await page.click(selector, options);
  }

  /**
   * Execute fill action
   * @param {Page} page - Playwright page instance
   * @param {Object} step - Step configuration
   */
  async executeFill(page, step) {
    const selector = step.selector;
    const value = step.value;
    const options = step.options || {};
    
    this.logger.debug('Filling input', { selector, value });
    await page.fill(selector, value, options);
  }

  /**
   * Execute waitForSelector action
   * @param {Page} page - Playwright page instance
   * @param {Object} step - Step configuration
   */
  async executeWaitForSelector(page, step) {
    const selector = step.selector;
    const options = step.options || { timeout: 30000 };
    
    this.logger.debug('Waiting for selector', { selector });
    await page.waitForSelector(selector, options);
  }

  /**
   * Execute waitForTimeout action
   * @param {Page} page - Playwright page instance
   * @param {Object} step - Step configuration
   */
  async executeWaitForTimeout(page, step) {
    const timeout = step.timeout || 1000;
    
    this.logger.debug('Waiting for timeout', { timeout });
    await page.waitForTimeout(timeout);
  }

  /**
   * Execute screenshot action
   * @param {Page} page - Playwright page instance
   * @param {Object} step - Step configuration
   */
  async executeScreenshot(page, step) {
    const path = step.path || `screenshot-${Date.now()}.png`;
    const options = step.options || {};
    
    this.logger.debug('Taking screenshot', { path });
    await page.screenshot({ path, ...options });
  }

  /**
   * Substitute variables in a step
   * @param {Object} step - Step configuration
   * @param {Object} variables - Variables to substitute
   * @returns {Object} - Step with substituted variables
   */
  substituteVariables(step, variables) {
    // Create a deep copy of the step
    let processedStep = JSON.parse(JSON.stringify(step));

    // Recursively substitute variables in all string properties
    const substituteInObject = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\{([^}]+)\}/g, (match, variableName) => {
          return variables.hasOwnProperty(variableName) ? variables[variableName] : match;
        });
      } else if (Array.isArray(obj)) {
        return obj.map(item => substituteInObject(item));
      } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
          newObj[key] = substituteInObject(obj[key]);
        }
        return newObj;
      }
      return obj;
    };

    processedStep = substituteInObject(processedStep);
    return processedStep;
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} retryCount - Number of retries attempted
   * @returns {number} - Delay in milliseconds
   */
  calculateBackoffDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const jitter = Math.random() * 1000; // Up to 1 second jitter
    
    const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1) + jitter, maxDelay);
    return Math.max(delay, baseDelay);
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after specified time
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current execution state
   * @returns {Object} - Current execution state
   */
  getExecutionState() {
    return this.executionState;
  }

  /**
   * Reset execution state
   */
  reset() {
    this.executionState = {
      currentStep: 0,
      completedSteps: [],
      failedSteps: [],
      startTime: null,
      endTime: null
    };
  }
}

module.exports = FlowExecutor;