const winston = require('winston');

/**
 * CaptchaSolver - Abstract base class for CAPTCHA solving services
 */
class CaptchaSolver {
  constructor(logger) {
    this.logger = logger || winston.createLogger({ transports: [new winston.transports.Console({ silent: true })] });
    this.apiKey = null;
    this.serviceName = 'abstract';
  }

  /**
   * Set API key for the service
   * @param {string} apiKey - API key for the service
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Solve a CAPTCHA
   * @param {Object} captchaData - CAPTCHA data
   * @returns {Promise<Object>} - Solution result
   */
  async solve(captchaData) {
    throw new Error('solve method must be implemented by subclass');
  }

  /**
   * Get service statistics
   * @returns {Object} - Service statistics
   */
  getStats() {
    return {
      serviceName: this.serviceName,
      apiKeySet: !!this.apiKey
    };
  }
}

/**
 * TwoCaptchaSolver - 2Captcha service implementation
 */
class TwoCaptchaSolver extends CaptchaSolver {
  constructor(logger) {
    super(logger);
    this.serviceName = '2captcha';
    this.baseUrl = 'https://2captcha.com';
  }

  /**
   * Solve a CAPTCHA using 2Captcha service
   * @param {Object} captchaData - CAPTCHA data
   * @returns {Promise<Object>} - Solution result
   */
  async solve(captchaData) {
    if (!this.apiKey) {
      throw new Error('API key not set for 2Captcha service');
    }

    this.logger.info('Solving CAPTCHA with 2Captcha', { 
      captchaType: captchaData.type,
      siteKey: captchaData.siteKey
    });

    try {
      // Submit CAPTCHA for solving
      const submitResponse = await this.submitCaptcha(captchaData);
      
      // Poll for result
      const result = await this.pollForResult(submitResponse.requestId);
      
      this.logger.info('CAPTCHA solved successfully with 2Captcha', { 
        captchaType: captchaData.type,
        solutionLength: result.solution?.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to solve CAPTCHA with 2Captcha', { 
        captchaType: captchaData.type,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Submit CAPTCHA to 2Captcha service
   * @param {Object} captchaData - CAPTCHA data
   * @returns {Promise<Object>} - Submission response
   */
  async submitCaptcha(captchaData) {
    const params = new URLSearchParams();
    params.append('key', this.apiKey);
    params.append('method', this.getMethodForCaptcha(captchaData.type));
    params.append('googlekey', captchaData.siteKey);
    params.append('pageurl', captchaData.pageUrl);
    params.append('json', '1');

    const response = await fetch(`${this.baseUrl}/in.php`, {
      method: 'POST',
      body: params
    });

    const data = await response.json();

    if (data.status !== 1) {
      throw new Error(`Failed to submit CAPTCHA: ${data.request}`);
    }

    return {
      requestId: data.request,
      timestamp: Date.now()
    };
  }

  /**
   * Poll for CAPTCHA solution
   * @param {string} requestId - Request ID from submission
   * @returns {Promise<Object>} - Solution result
   */
  async pollForResult(requestId) {
    const maxAttempts = 30; // 30 attempts with 5 second delays = 2.5 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      await this.sleep(5000); // Wait 5 seconds between attempts

      const params = new URLSearchParams();
      params.append('key', this.apiKey);
      params.append('action', 'get');
      params.append('id', requestId);
      params.append('json', '1');

      const response = await fetch(`${this.baseUrl}/res.php`, {
        method: 'POST',
        body: params
      });

      const data = await response.json();

      if (data.status === 1) {
        return {
          success: true,
          solution: data.request,
          provider: this.serviceName,
          timestamp: Date.now()
        };
      }

      if (data.request !== 'CAPCHA_NOT_READY') {
        throw new Error(`CAPTCHA solving failed: ${data.request}`);
      }

      attempts++;
    }

    throw new Error('CAPTCHA solving timeout');
  }

  /**
   * Get method for CAPTCHA type
   * @param {string} captchaType - CAPTCHA type
   * @returns {string} - Method for the CAPTCHA type
   */
  getMethodForCaptcha(captchaType) {
    const methodMap = {
      'recaptcha2': 'userrecaptcha',
      'recaptcha3': 'userrecaptcha',
      'hcaptcha': 'hcaptcha',
      'funcaptcha': 'funcaptcha',
      'text': 'text',
      'image': 'base64'
    };

    return methodMap[captchaType] || 'userrecaptcha';
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after specified time
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * AntiCaptchaSolver - Anti-Captcha service implementation
 */
class AntiCaptchaSolver extends CaptchaSolver {
  constructor(logger) {
    super(logger);
    this.serviceName = 'anticaptcha';
    this.baseUrl = 'https://api.anti-captcha.com';
  }

  /**
   * Solve a CAPTCHA using Anti-Captcha service
   * @param {Object} captchaData - CAPTCHA data
   * @returns {Promise<Object>} - Solution result
   */
  async solve(captchaData) {
    if (!this.apiKey) {
      throw new Error('API key not set for Anti-Captcha service');
    }

    this.logger.info('Solving CAPTCHA with Anti-Captcha', { 
      captchaType: captchaData.type,
      siteKey: captchaData.siteKey
    });

    try {
      // Submit CAPTCHA for solving
      const submitResponse = await this.submitCaptcha(captchaData);
      
      // Poll for result
      const result = await this.pollForResult(submitResponse.taskId);
      
      this.logger.info('CAPTCHA solved successfully with Anti-Captcha', { 
        captchaType: captchaData.type,
        solutionLength: result.solution?.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to solve CAPTCHA with Anti-Captcha', { 
        captchaType: captchaData.type,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Submit CAPTCHA to Anti-Captcha service
   * @param {Object} captchaData - CAPTCHA data
   * @returns {Promise<Object>} - Submission response
   */
  async submitCaptcha(captchaData) {
    const requestBody = {
      clientKey: this.apiKey,
      task: {
        type: this.getTaskTypeForCaptcha(captchaData.type),
        websiteURL: captchaData.pageUrl,
        websiteKey: captchaData.siteKey
      }
    };

    const response = await fetch(`${this.baseUrl}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.errorId !== 0) {
      throw new Error(`Failed to submit CAPTCHA: ${data.errorDescription}`);
    }

    return {
      taskId: data.taskId,
      timestamp: Date.now()
    };
  }

  /**
   * Poll for CAPTCHA solution
   * @param {string} taskId - Task ID from submission
   * @returns {Promise<Object>} - Solution result
   */
  async pollForResult(taskId) {
    const maxAttempts = 30; // 30 attempts with 5 second delays = 2.5 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      await this.sleep(5000); // Wait 5 seconds between attempts

      const requestBody = {
        clientKey: this.apiKey,
        taskId: taskId
      };

      const response = await fetch(`${this.baseUrl}/getTaskResult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.errorId !== 0) {
        throw new Error(`CAPTCHA solving failed: ${data.errorDescription}`);
      }

      if (data.status === 'ready') {
        return {
          success: true,
          solution: data.solution?.gRecaptchaResponse,
          provider: this.serviceName,
          timestamp: Date.now()
        };
      }

      if (data.status !== 'processing') {
        throw new Error(`Unexpected task status: ${data.status}`);
      }

      attempts++;
    }

    throw new Error('CAPTCHA solving timeout');
  }

  /**
   * Get task type for CAPTCHA type
   * @param {string} captchaType - CAPTCHA type
   * @returns {string} - Task type for the CAPTCHA type
   */
  getTaskTypeForCaptcha(captchaType) {
    const taskTypeMap = {
      'recaptcha2': 'NoCaptchaTaskProxyless',
      'recaptcha3': 'RecaptchaV3TaskProxyless',
      'hcaptcha': 'HCaptchaTaskProxyless',
      'funcaptcha': 'FunCaptchaTaskProxyless'
    };

    return taskTypeMap[captchaType] || 'NoCaptchaTaskProxyless';
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after specified time
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * CaptchaSolverManager - Manages multiple CAPTCHA solving services
 */
class CaptchaSolverManager {
  constructor(logger) {
    this.logger = logger || winston.createLogger({ transports: [new winston.transports.Console({ silent: true })] });
    this.solvers = new Map();
    this.stats = {
      totalSolved: 0,
      totalFailed: 0,
      serviceUsage: {}
    };
  }

  /**
   * Add a CAPTCHA solver service
   * @param {string} serviceName - Name of the service
   * @param {CaptchaSolver} solver - Solver instance
   */
  addSolver(serviceName, solver) {
    this.solvers.set(serviceName, solver);
    this.stats.serviceUsage[serviceName] = {
      solved: 0,
      failed: 0,
      avgResponseTime: 0
    };
    this.logger.info('CAPTCHA solver added', { serviceName });
  }

  /**
   * Set API key for a service
   * @param {string} serviceName - Name of the service
   * @param {string} apiKey - API key for the service
   */
  setApiKey(serviceName, apiKey) {
    const solver = this.solvers.get(serviceName);
    if (solver) {
      solver.setApiKey(apiKey);
      this.logger.info('API key set for CAPTCHA solver', { serviceName });
    }
  }

  /**
   * Solve a CAPTCHA using the best available service
   * @param {Object} captchaData - CAPTCHA data
   * @returns {Promise<Object>} - Solution result
   */
  async solveCaptcha(captchaData) {
    if (this.solvers.size === 0) {
      throw new Error('No CAPTCHA solvers configured');
    }

    // Try solvers in order of preference
    const solverNames = Array.from(this.solvers.keys());
    
    for (const serviceName of solverNames) {
      try {
        const solver = this.solvers.get(serviceName);
        const startTime = Date.now();
        
        const result = await solver.solve(captchaData);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Update statistics
        this.stats.totalSolved++;
        this.stats.serviceUsage[serviceName].solved++;
        this.updateAvgResponseTime(serviceName, responseTime);
        
        this.logger.info('CAPTCHA solved successfully', { 
          serviceName,
          captchaType: captchaData.type,
          responseTime
        });
        
        return result;
      } catch (error) {
        this.logger.warn('CAPTCHA solver failed, trying next service', { 
          serviceName,
          captchaType: captchaData.type,
          error: error.message
        });
        
        // Update statistics
        this.stats.totalFailed++;
        this.stats.serviceUsage[serviceName].failed++;
      }
    }
    
    throw new Error('All CAPTCHA solvers failed');
  }

  /**
   * Update average response time for a service
   * @param {string} serviceName - Name of the service
   * @param {number} responseTime - Response time in milliseconds
   */
  updateAvgResponseTime(serviceName, responseTime) {
    const serviceStats = this.stats.serviceUsage[serviceName];
    const totalSolved = serviceStats.solved;
    
    if (totalSolved === 1) {
      serviceStats.avgResponseTime = responseTime;
    } else {
      // Calculate new average
      const currentAvg = serviceStats.avgResponseTime;
      const newAvg = ((currentAvg * (totalSolved - 1)) + responseTime) / totalSolved;
      serviceStats.avgResponseTime = newAvg;
    }
  }

  /**
   * Get solver statistics
   * @returns {Object} - Solver statistics
   */
  getStats() {
    return {
      totalSolved: this.stats.totalSolved,
      totalFailed: this.stats.totalFailed,
      successRate: this.stats.totalSolved + this.stats.totalFailed > 0 
        ? this.stats.totalSolved / (this.stats.totalSolved + this.stats.totalFailed)
        : 0,
      serviceUsage: this.stats.serviceUsage,
      availableServices: Array.from(this.solvers.keys())
    };
  }

  /**
   * Get best solver based on performance
   * @returns {CaptchaSolver|null} - Best solver or null if none available
   */
  getBestSolver() {
    if (this.solvers.size === 0) {
      return null;
    }

    const solverNames = Array.from(this.solvers.keys());
    if (solverNames.length === 1) {
      return this.solvers.get(solverNames[0]);
    }

    // Sort by success rate and response time
    solverNames.sort((a, b) => {
      const statsA = this.stats.serviceUsage[a];
      const statsB = this.stats.serviceUsage[b];
      
      // If one has no usage data, prefer the one with data
      if ((statsA.solved + statsA.failed) === 0 && (statsB.solved + statsB.failed) > 0) {
        return 1;
      }
      if ((statsA.solved + statsA.failed) > 0 && (statsB.solved + statsB.failed) === 0) {
        return -1;
      }
      
      // Compare success rates
      const successRateA = statsA.solved / (statsA.solved + statsA.failed || 1);
      const successRateB = statsB.solved / (statsB.solved + statsB.failed || 1);
      
      if (successRateA !== successRateB) {
        return successRateB - successRateA; // Higher success rate first
      }
      
      // If success rates are equal, compare response times
      return statsA.avgResponseTime - statsB.avgResponseTime; // Lower response time first
    });

    return this.solvers.get(solverNames[0]);
  }
}

module.exports = {
  CaptchaSolver,
  TwoCaptchaSolver,
  AntiCaptchaSolver,
  CaptchaSolverManager
};