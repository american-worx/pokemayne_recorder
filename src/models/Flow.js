import { v4 as uuidv4 } from 'uuid';

export class Flow {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.retailer = data.retailer || null;
    this.steps = data.steps || [];

    // Additional fields
    this.name = data.name || '';
    this.description = data.description || '';
    this.type = data.type || 'automation'; // automation, recording, monitoring
    this.category = data.category || 'checkout'; // checkout, login, search, monitor
    this.version = data.version || '1.0.0';

    // Flow configuration
    this.config = data.config || {
      timeout: 60000,
      retries: 3,
      humanBehavior: true,
      stealthMode: true,
      headless: true,
      screenshots: true,
      errorRecovery: true
    };

    // Execution settings
    this.executionSettings = data.executionSettings || {
      maxConcurrency: 1,
      queuePriority: 'normal', // low, normal, high, urgent
      schedule: null, // cron expression for scheduled runs
      enabled: true,
      conditions: [] // pre-conditions that must be met
    };

    // Performance metrics
    this.performance = data.performance || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      lastExecutionTime: null,
      successRate: 0
    };

    // Dependencies and requirements
    this.dependencies = data.dependencies || {
      userProfile: false,
      paymentMethod: false,
      shippingAddress: false,
      product: false,
      retailerAccount: false
    };

    // Validation rules
    this.validation = data.validation || {
      requiredFields: [],
      customRules: [],
      skipValidation: false
    };

    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastExecuted = data.lastExecuted || null;
    this.createdBy = data.createdBy || null;
    this.isActive = data.isActive ?? true;
    this.status = data.status || 'draft'; // draft, active, deprecated, error
  }

  // Step management
  addStep(step) {
    const stepWithId = {
      id: step.id || uuidv4(),
      type: step.type || 'action', // action, wait, condition, loop
      action: step.action || '', // click, type, navigate, wait
      selector: step.selector || '',
      value: step.value || '',
      timeout: step.timeout || 5000,
      retries: step.retries || 1,
      optional: step.optional || false,
      condition: step.condition || null,
      description: step.description || '',
      order: step.order || this.steps.length,
      ...step
    };

    this.steps.push(stepWithId);
    this.steps.sort((a, b) => a.order - b.order);
    this.updatedAt = new Date().toISOString();
    return this;
  }

  removeStep(stepId) {
    this.steps = this.steps.filter(step => step.id !== stepId);
    this.reorderSteps();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateStep(stepId, updates) {
    const stepIndex = this.steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      this.steps[stepIndex] = { ...this.steps[stepIndex], ...updates };
      this.updatedAt = new Date().toISOString();
    }
    return this;
  }

  reorderSteps() {
    this.steps.forEach((step, index) => {
      step.order = index;
    });
    this.updatedAt = new Date().toISOString();
    return this;
  }

  moveStep(stepId, newOrder) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.order = newOrder;
      this.steps.sort((a, b) => a.order - b.order);
      this.reorderSteps();
    }
    return this;
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Flow name is required');
    }

    if (!this.retailer) {
      errors.push('Retailer is required');
    }

    if (this.steps.length === 0) {
      errors.push('At least one step is required');
    }

    // Validate steps
    this.steps.forEach((step, index) => {
      if (!step.type) {
        errors.push(`Step ${index + 1}: Step type is required`);
      }

      if (!step.action && step.type === 'action') {
        errors.push(`Step ${index + 1}: Action is required for action steps`);
      }

      if (!step.selector && ['click', 'type', 'wait_for_element'].includes(step.action)) {
        errors.push(`Step ${index + 1}: Selector is required for ${step.action} actions`);
      }
    });

    // Validate dependencies
    if (this.dependencies.userProfile && !this.validation.requiredFields.includes('userProfile')) {
      errors.push('User profile is required but not validated');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Execution tracking
  recordExecution(success, executionTime, _error = null) {
    this.performance.totalExecutions++;
    this.performance.lastExecutionTime = executionTime;
    this.lastExecuted = new Date().toISOString();

    if (success) {
      this.performance.successfulExecutions++;
    } else {
      this.performance.failedExecutions++;
    }

    // Calculate success rate
    this.performance.successRate = (this.performance.successfulExecutions / this.performance.totalExecutions) * 100;

    // Calculate average execution time
    const total = this.performance.totalExecutions;
    this.performance.averageExecutionTime = total === 1
      ? executionTime
      : (this.performance.averageExecutionTime * (total - 1) + executionTime) / total;

    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Configuration updates
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateExecutionSettings(settings) {
    this.executionSettings = { ...this.executionSettings, ...settings };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Status management
  setStatus(status) {
    this.status = status;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  activate() {
    this.isActive = true;
    this.status = 'active';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  deactivate() {
    this.isActive = false;
    this.status = 'deprecated';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Clone flow
  clone(newName = null) {
    const clonedData = JSON.parse(JSON.stringify(this.toJSON()));
    clonedData.id = uuidv4();
    clonedData.name = newName || `${this.name} (Copy)`;
    clonedData.version = '1.0.0';
    clonedData.createdAt = new Date().toISOString();
    clonedData.updatedAt = new Date().toISOString();
    clonedData.performance = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      lastExecutionTime: null,
      successRate: 0
    };

    return new Flow(clonedData);
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      retailer: this.retailer,
      steps: this.steps,
      name: this.name,
      description: this.description,
      type: this.type,
      category: this.category,
      version: this.version,
      config: this.config,
      executionSettings: this.executionSettings,
      performance: this.performance,
      dependencies: this.dependencies,
      validation: this.validation,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastExecuted: this.lastExecuted,
      createdBy: this.createdBy,
      isActive: this.isActive,
      status: this.status
    };
  }

  static fromJSON(data) {
    return new Flow(data);
  }

  // Query helpers
  static getRedisKey(id) {
    return `flow:${id}`;
  }

  static getRetailerFlowsKey(retailerId) {
    return `retailer:${retailerId}:flows`;
  }

  static getActiveFlowsKey() {
    return 'flows:active';
  }

  static getCategoryFlowsKey(category) {
    return `flows:category:${category}`;
  }
}

export default Flow;