const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const winston = require('winston');

/**
 * ConfigurationManager - Manages configuration loading and validation
 */
class ConfigurationManager {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Load configuration from a file
   * @param {string} configPath - Path to the configuration file
   * @returns {Object} - Loaded configuration
   */
  async loadConfig(configPath) {
    try {
      this.logger.info('Loading configuration', { path: configPath });
      
      // Check if file exists
      try {
        await fs.access(configPath);
      } catch (error) {
        throw new Error(`Configuration file not found: ${configPath}`);
      }

      // Determine file type by extension
      const ext = path.extname(configPath).toLowerCase();
      let config;

      if (ext === '.yaml' || ext === '.yml') {
        // Load YAML configuration
        const fileContent = await fs.readFile(configPath, 'utf8');
        config = yaml.load(fileContent);
      } else if (ext === '.json') {
        // Load JSON configuration
        const fileContent = await fs.readFile(configPath, 'utf8');
        config = JSON.parse(fileContent);
      } else {
        throw new Error(`Unsupported configuration file format: ${ext}`);
      }

      // Apply environment variable overrides
      config = this.applyEnvironmentOverrides(config);

      this.logger.info('Configuration loaded successfully', { path: configPath });
      return config;
    } catch (error) {
      this.logger.error('Failed to load configuration', { 
        path: configPath, 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Save configuration to a file
   * @param {Object} config - Configuration to save
   * @param {string} configPath - Path to save the configuration file
   */
  async saveConfig(config, configPath) {
    try {
      this.logger.info('Saving configuration', { path: configPath });
      
      // Determine file type by extension
      const ext = path.extname(configPath).toLowerCase();
      let fileContent;

      if (ext === '.yaml' || ext === '.yml') {
        // Save as YAML
        fileContent = yaml.dump(config);
      } else if (ext === '.json') {
        // Save as JSON
        fileContent = JSON.stringify(config, null, 2);
      } else {
        throw new Error(`Unsupported configuration file format: ${ext}`);
      }

      // Ensure directory exists
      const dirPath = path.dirname(configPath);
      await fs.mkdir(dirPath, { recursive: true });

      // Write file
      await fs.writeFile(configPath, fileContent, 'utf8');
      
      this.logger.info('Configuration saved successfully', { path: configPath });
    } catch (error) {
      this.logger.error('Failed to save configuration', { 
        path: configPath, 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate configuration structure
   * @param {Object} config - Configuration to validate
   * @param {Array<string>} requiredFields - Required fields in the configuration
   * @returns {boolean} - Whether the configuration is valid
   */
  validateConfig(config, requiredFields = []) {
    try {
      this.logger.debug('Validating configuration', { requiredFields });
      
      // Check if config is an object
      if (!config || typeof config !== 'object') {
        throw new Error('Configuration must be an object');
      }

      // Check required fields
      for (const field of requiredFields) {
        if (!(field in config)) {
          throw new Error(`Required field missing: ${field}`);
        }
      }

      this.logger.info('Configuration validation passed');
      return true;
    } catch (error) {
      this.logger.error('Configuration validation failed', { 
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Merge configuration with defaults
   * @param {Object} config - User configuration
   * @param {Object} defaults - Default configuration values
   * @returns {Object} - Merged configuration
   */
  mergeWithDefaults(config, defaults) {
    this.logger.debug('Merging configuration with defaults');
    
    // Simple deep merge implementation
    const merged = { ...defaults };
    
    for (const key in config) {
      if (config[key] !== null && typeof config[key] === 'object' && !Array.isArray(config[key])) {
        merged[key] = this.mergeWithDefaults(config[key], merged[key] || {});
      } else {
        merged[key] = config[key];
      }
    }
    
    return merged;
  }

  /**
   * Load flow configuration
   * @param {string} flowPath - Path to the flow configuration file
   * @returns {Object} - Loaded flow configuration
   */
  async loadFlow(flowPath) {
    try {
      this.logger.info('Loading flow configuration', { path: flowPath });
      
      const flowConfig = await this.loadConfig(flowPath);
      
      // Validate flow configuration structure
      const requiredFields = ['site', 'steps'];
      this.validateConfig(flowConfig, requiredFields);
      
      this.logger.info('Flow configuration loaded successfully', { path: flowPath });
      return flowConfig;
    } catch (error) {
      this.logger.error('Failed to load flow configuration', { 
        path: flowPath, 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create a default flow template
   * @param {string} site - Site name
   * @returns {Object} - Default flow template
   */
  createDefaultFlowTemplate(site) {
    return {
      site: site,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      steps: [
        {
          action: 'goto',
          url: '',
          description: 'Navigate to product page'
        },
        {
          action: 'click',
          selector: '',
          description: 'Add to cart'
        },
        {
          action: 'goto',
          url: '/checkout',
          description: 'Navigate to checkout'
        },
        {
          action: 'fill',
          selector: '',
          value: '{email}',
          description: 'Fill email'
        }
      ],
      variables: {
        email: '',
        size: '',
        shipping: {},
        payment: {}
      },
      options: {
        stealthLevel: 'high',
        maxRetries: 3,
        timeout: 30000
      }
    };
  }

  /**
   * Apply environment variable overrides to configuration
   * @param {Object} config - Configuration to override
   * @returns {Object} - Configuration with environment overrides applied
   */
  applyEnvironmentOverrides(config) {
    this.logger.debug('Applying environment variable overrides');
    
    // Recursively process the configuration
    const processConfig = (obj, prefix = '') => {
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const result = {};
        for (const key in obj) {
          const envKey = prefix ? `${prefix}_${key.toUpperCase()}` : key.toUpperCase();
          const envValue = process.env[envKey];
          
          if (envValue !== undefined) {
            // Try to parse as JSON for complex values, otherwise use as string
            try {
              result[key] = JSON.parse(envValue);
              this.logger.debug('Applied environment override', { key: envKey, value: envValue });
            } catch (e) {
              result[key] = envValue;
              this.logger.debug('Applied environment override', { key: envKey, value: envValue });
            }
          } else {
            result[key] = processConfig(obj[key], envKey);
          }
        }
        return result;
      }
      return obj;
    };
    
    return processConfig(config);
  }

  /**
   * Get a configuration value with environment override support
   * @param {string} key - Configuration key (dot notation)
   * @param {*} defaultValue - Default value if not found
   * @returns {*} - Configuration value
   */
  getConfigValue(key, defaultValue = null) {
    // First check environment variable
    const envKey = key.replace(/\./g, '_').toUpperCase();
    if (process.env[envKey] !== undefined) {
      try {
        return JSON.parse(process.env[envKey]);
      } catch (e) {
        return process.env[envKey];
      }
    }
    
    // Return default value if no environment override
    return defaultValue;
  }
}

module.exports = ConfigurationManager;