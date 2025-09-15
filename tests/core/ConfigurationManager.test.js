const ConfigurationManager = require('../../src/core/ConfigurationManager');
const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;

// Mock logger for testing
const mockLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })]
});

describe('ConfigurationManager', () => {
  let configManager;
  let tempDir;

  beforeEach(() => {
    configManager = new ConfigurationManager(mockLogger);
    tempDir = path.join(__dirname, '..', 'temp');
  });

  afterEach(async () => {
    // Clean up temp files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should create a ConfigurationManager instance', () => {
    expect(configManager).toBeInstanceOf(ConfigurationManager);
    expect(configManager.logger).toBe(mockLogger);
  });

  test('should validate a correct configuration', () => {
    const config = { site: 'nike', steps: [] };
    const isValid = configManager.validateConfig(config, ['site', 'steps']);
    expect(isValid).toBe(true);
  });

  test('should reject an invalid configuration', () => {
    const config = { site: 'nike' };
    const isValid = configManager.validateConfig(config, ['site', 'steps']);
    expect(isValid).toBe(false);
  });

  test('should merge configuration with defaults', () => {
    const config = { site: 'nike', steps: [] };
    const defaults = { options: { timeout: 30000 }, variables: {} };
    const merged = configManager.mergeWithDefaults(config, defaults);
    
    expect(merged.site).toBe('nike');
    expect(merged.steps).toEqual([]);
    expect(merged.options.timeout).toBe(30000);
    expect(merged.variables).toEqual({});
  });

  test('should create a default flow template', () => {
    const template = configManager.createDefaultFlowTemplate('nike');
    
    expect(template.site).toBe('nike');
    expect(template.version).toBe('1.0.0');
    expect(Array.isArray(template.steps)).toBe(true);
    expect(template.steps.length).toBeGreaterThan(0);
    expect(template.variables).toBeDefined();
    expect(template.options).toBeDefined();
  });
});