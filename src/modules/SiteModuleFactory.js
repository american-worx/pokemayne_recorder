const path = require('path');
const fs = require('fs').promises;
const winston = require('winston');
const BaseSiteModule = require('./BaseSiteModule');

/**
 * SiteModuleFactory - Factory for creating site-specific modules
 */
class SiteModuleFactory {
  constructor(logger) {
    this.logger = logger;
    this.modules = new Map();
    this.modulePaths = new Map();
  }

  /**
   * Create a site-specific module instance
   * @param {string} siteName - Name of the site (e.g., 'nike', 'target', 'bestbuy')
   * @param {Object} config - Configuration for the site module
   * @returns {Object} - Site module instance
   */
  createModule(siteName, config = {}) {
    try {
      this.logger.debug('Creating site module', { site: siteName });
      
      // Check if module is already loaded
      if (this.modules.has(siteName)) {
        this.logger.info('Using cached site module', { site: siteName });
        const ModuleClass = this.modules.get(siteName);
        return new ModuleClass(config, this.logger);
      }

      // Try to load the site module from file system
      const modulePath = this.getModulePath(siteName);
      this.logger.debug('Loading site module from path', { site: siteName, path: modulePath });
      
      try {
        // Try to load the specific site module
        const ModuleClass = require(modulePath);
        this.modules.set(siteName, ModuleClass);
        this.modulePaths.set(siteName, modulePath);
        
        this.logger.info('Site module loaded successfully', { site: siteName, path: modulePath });
        return new ModuleClass(config, this.logger);
      } catch (moduleError) {
        // If specific module doesn't exist, use base module
        this.logger.warn('Site module not found, using base module', { 
          site: siteName, 
          error: moduleError.message 
        });
        
        this.modules.set(siteName, BaseSiteModule);
        return new BaseSiteModule(config, this.logger);
      }
    } catch (error) {
      this.logger.error('Failed to create site module', { 
        site: siteName, 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get the path for a site module
   * @param {string} siteName - Name of the site
   * @returns {string} - Path to the module file
   */
  getModulePath(siteName) {
    // Check if we have a cached path
    if (this.modulePaths.has(siteName)) {
      return this.modulePaths.get(siteName);
    }
    
    // Generate the path
    const moduleName = `${siteName.charAt(0).toUpperCase() + siteName.slice(1)}Module`;
    const modulePath = path.join(__dirname, `${moduleName}.js`);
    
    return modulePath;
  }

  /**
   * Register a custom site module
   * @param {string} siteName - Name of the site
   * @param {Class} moduleClass - Module class to register
   */
  registerModule(siteName, moduleClass) {
    this.logger.info('Registering custom site module', { site: siteName });
    this.modules.set(siteName, moduleClass);
  }

  /**
   * Get list of supported sites
   * @returns {Array<string>} - List of supported site names
   */
  getSupportedSites() {
    // For now, return the sites we know we want to support
    return ['nike', 'target', 'bestbuy', 'saucedemo'];
  }

  /**
   * Discover available site modules in the modules directory
   * @returns {Promise<Array<string>>} - List of available site modules
   */
  async discoverModules() {
    try {
      this.logger.info('Discovering site modules');
      
      // Read the modules directory
      const files = await fs.readdir(__dirname);
      
      // Filter for module files
      const moduleFiles = files.filter(file => 
        file.endsWith('Module.js') && 
        file !== 'BaseSiteModule.js' &&
        file !== 'SiteModuleFactory.js'
      );
      
      // Extract site names from file names
      const siteNames = moduleFiles.map(file => {
        const moduleName = path.basename(file, 'Module.js');
        return moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
      });
      
      this.logger.info('Discovered site modules', { sites: siteNames });
      return siteNames;
    } catch (error) {
      this.logger.error('Failed to discover site modules', { error: error.message });
      return [];
    }
  }

  /**
   * Validate a module class
   * @param {Class} moduleClass - Module class to validate
   * @returns {boolean} - Whether the module class is valid
   */
  validateModule(moduleClass) {
    this.logger.debug('Validating module class');
    
    // Check if it's a class
    if (typeof moduleClass !== 'function') {
      this.logger.error('Module is not a function/class');
      return false;
    }
    
    // Check if it extends BaseSiteModule or has required methods
    const requiredMethods = [
      'initialize',
      'executeCheckout',
      'recordFlow',
      'handleCaptcha',
      'handleError'
    ];
    
    for (const method of requiredMethods) {
      if (typeof moduleClass.prototype[method] !== 'function') {
        this.logger.error('Module missing required method', { method });
        return false;
      }
    }
    
    this.logger.debug('Module validation passed');
    return true;
  }

  /**
   * Get module information
   * @param {string} siteName - Name of the site
   * @returns {Object|null} - Module information or null if not found
   */
  getModuleInfo(siteName) {
    if (!this.modules.has(siteName)) {
      return null;
    }
    
    const ModuleClass = this.modules.get(siteName);
    const modulePath = this.modulePaths.get(siteName) || 'registered';
    
    return {
      siteName,
      path: modulePath,
      registered: !!this.modulePaths.get(siteName)
    };
  }
}

module.exports = SiteModuleFactory;