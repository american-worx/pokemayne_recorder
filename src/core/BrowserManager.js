const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const winston = require('winston');
const path = require('path');
const { ProxyManager } = require('./ProxyManager');

/**
 * BrowserManager - Manages browser instances and contexts with stealth capabilities
 */
class BrowserManager {
  constructor(logger) {
    this.logger = logger;
    this.browser = null;
    this.contexts = new Map();
    this.proxyManager = new ProxyManager(logger);
    
    // Apply stealth plugin
    chromium.use(stealth);
  }

  /**
   * Launch a stealthy browser instance
   * @param {Object} options - Browser launch options
   * @returns {Promise<Browser>} - Launched browser instance
   */
  async launchBrowser(options = {}) {
    try {
      const launchOptions = {
        headless: process.env.HEADLESS !== 'false',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--allow-running-insecure-content'
        ],
        ...options
      };

      this.browser = await chromium.launch(launchOptions);
      this.logger.info('Browser launched successfully', { headless: launchOptions.headless });
      
      return this.browser;
    } catch (error) {
      this.logger.error('Failed to launch browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new browser context with stealth settings
   * @param {Object} options - Context options
   * @returns {Promise<Object>} - Created browser context with ID
   */
  async createContext(options = {}) {
    if (!this.browser) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }

    try {
      // Generate randomized viewport
      const viewport = this.getRandomViewport();
      
      // Default stealth settings
      const contextOptions = {
        viewport: viewport,
        userAgent: this.getRandomUserAgent(),
        timezoneId: this.getRandomTimezone(),
        locale: this.getRandomLocale(),
        ...options
      };

      // Add proxy if configured or use ProxyManager
      if (process.env.PROXY_SERVER) {
        contextOptions.proxy = {
          server: process.env.PROXY_SERVER,
          username: process.env.PROXY_USERNAME,
          password: process.env.PROXY_PASSWORD
        };
      } else if (this.proxyManager) {
        // Use ProxyManager to get next available proxy
        const proxy = this.proxyManager.getNextProxy();
        if (proxy) {
          contextOptions.proxy = proxy.getPlaywrightConfig();
          this.logger.debug('Using proxy from ProxyManager', { proxyId: proxy.id });
        }
      }

      const context = await this.browser.newContext(contextOptions);
      
      // Apply additional stealth measures
      await this.applyStealthEvasions(context);
      
      // Store context with a unique ID
      const contextId = this.generateContextId();
      this.contexts.set(contextId, context);
      
      this.logger.info('Browser context created', { contextId, viewport, userAgent: contextOptions.userAgent });
      
      return { contextId, context };
    } catch (error) {
      this.logger.error('Failed to create browser context', { error: error.message });
      throw error;
    }
  }

  /**
   * Close a specific browser context
   * @param {string} contextId - ID of the context to close
   */
  async closeContext(contextId) {
    const context = this.contexts.get(contextId);
    if (context) {
      await context.close();
      this.contexts.delete(contextId);
      this.logger.info('Browser context closed', { contextId });
    }
  }

  /**
   * Close all browser contexts and the browser
   */
  async closeAll() {
    try {
      // Close all contexts
      for (const [contextId, context] of this.contexts) {
        await context.close();
        this.logger.info('Browser context closed', { contextId });
      }
      
      this.contexts.clear();
      
      // Close browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.logger.info('Browser closed');
      }
    } catch (error) {
      this.logger.error('Error closing browser resources', { error: error.message });
      throw error;
    }
  }

  /**
   * Apply additional stealth evasions to a context
   * @param {BrowserContext} context - Browser context to apply evasions to
   */
  async applyStealthEvasions(context) {
    // Override navigator.webdriver
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Override navigator.plugins
    await context.addInitScript(() => {
      const plugins = [
        {
          name: 'Chrome PDF Plugin',
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
        },
        {
          name: 'Chrome PDF Viewer',
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
        },
        {
          name: 'Native Client',
          description: '',
          filename: 'internal-nacl-plugin',
        }
      ];
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => plugins,
      });
    });

    // Override navigator.languages
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Override navigator.platform
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32',
      });
    });

    // Override navigator.hardwareConcurrency
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4,
      });
    });

    // Override navigator.deviceMemory
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });
    });

    // Hide Chrome-specific properties
    await context.addInitScript(() => {
      if (window.chrome) {
        delete window.chrome;
      }
    });
  }

  /**
   * Get a random user agent string
   * @returns {string} - Random user agent
   */
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Get a random viewport size
   * @returns {Object} - Random viewport dimensions
   */
  getRandomViewport() {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 720 }
    ];
    
    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  /**
   * Get a random timezone
   * @returns {string} - Random timezone
   */
  getRandomTimezone() {
    const timezones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Australia/Sydney'
    ];
    
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  /**
   * Get a random locale
   * @returns {string} - Random locale
   */
  getRandomLocale() {
    const locales = [
      'en-US',
      'en-GB',
      'en-CA',
      'en-AU',
      'fr-FR',
      'de-DE',
      'es-ES',
      'ja-JP'
    ];
    
    return locales[Math.floor(Math.random() * locales.length)];
  }

  /**
   * Generate a unique context ID
   * @returns {string} - Unique context ID
   */
  generateContextId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Rotate proxy for a context
   * @param {string} contextId - ID of the context to rotate proxy for
   * @param {Object} proxyOptions - New proxy options
   * @returns {Promise<Object>} - New context with rotated proxy
   */
  async rotateProxy(contextId, proxyOptions) {
    // Note: Playwright doesn't support changing proxy for existing context
    // We need to create a new context with the new proxy settings
    this.logger.warn('Proxy rotation requires creating a new context', { contextId });
    
    // Close existing context
    await this.closeContext(contextId);
    
    // Create new context with new proxy
    const newContextOptions = {
      proxy: proxyOptions
    };
    
    return await this.createContext(newContextOptions);
  }

  /**
   * Get browser information
   * @returns {Object} - Browser information
   */
  getBrowserInfo() {
    return {
      browser: this.browser ? this.browser.constructor.name : null,
      contexts: this.contexts.size,
      isConnected: this.browser ? this.browser.isConnected() : false
    };
  }

  /**
   * Load proxies into the ProxyManager
   * @param {Array<Object>} proxyConfigs - Array of proxy configurations
   */
  loadProxies(proxyConfigs) {
    if (this.proxyManager) {
      this.proxyManager.loadProxies(proxyConfigs);
      this.logger.info('Proxies loaded into ProxyManager', { proxyCount: proxyConfigs.length });
    }
  }

  /**
   * Get ProxyManager instance
   * @returns {ProxyManager} - ProxyManager instance
   */
  getProxyManager() {
    return this.proxyManager;
  }
}

module.exports = BrowserManager;