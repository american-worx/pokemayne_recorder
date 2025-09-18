import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { getRandomUserAgent } from './utils/user-agents.js';
import { getRandomViewport } from './utils/viewports.js';
import logger from './utils/logger.js';

class BrowserManager {
  constructor(options = {}) {
    this.options = {
      headless: options.headless ?? true,
      stealthLevel: options.stealthLevel ?? 'ultra',
      proxyRotation: options.proxyRotation ?? true,
      recordingMode: options.recordingMode ?? false,
      ...options
    };

    this.browsers = new Map();
    this.contexts = new Map();
    this.proxies = [];
    this.currentProxyIndex = 0;

    this.setupStealth();
  }

  setupStealth() {
    // Apply stealth plugin with default configuration
    chromium.use(stealth());

    logger.info('Stealth plugin configured with default evasions');
  }

  async launchStealthyBrowser(sessionId = 'default') {
    const browserId = `browser_${sessionId}`;

    if (this.browsers.has(browserId)) {
      return this.browsers.get(browserId);
    }

    const launchOptions = {
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-translate',
        '--disable-device-discovery-notifications',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--enable-automation=false',
        '--exclude-switches=enable-automation',
        '--disable-blink-features=AutomationControlled'
      ]
    };

    if (this.options.proxy) {
      launchOptions.proxy = this.options.proxy;
    }

    const browser = await chromium.launch(launchOptions);
    this.browsers.set(browserId, browser);

    logger.info(`Stealthy browser launched: ${browserId}`);
    return browser;
  }

  async createStealthyContext(browser, sessionId = 'default') {
    const contextId = `context_${sessionId}`;

    if (this.contexts.has(contextId)) {
      return this.contexts.get(contextId);
    }

    const userAgent = getRandomUserAgent();
    const viewport = getRandomViewport();

    const contextOptions = {
      userAgent,
      viewport,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      geolocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    };

    // Add proxy if available
    if (this.options.proxy) {
      contextOptions.proxy = this.options.proxy;
    }

    const context = await browser.newContext(contextOptions);

    // Inject stealth scripts
    await this.injectStealthScripts(context);

    this.contexts.set(contextId, context);

    logger.info(`Stealthy context created: ${contextId}`, { userAgent, viewport });
    return context;
  }

  async injectStealthScripts(context) {
    // Advanced anti-detection scripts
    await context.addInitScript(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {
              type: 'application/x-google-chrome-pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: Plugin
            },
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            length: 1,
            name: 'Chrome PDF Plugin'
          },
          {
            0: {
              type: 'application/pdf',
              suffixes: 'pdf',
              description: '',
              enabledPlugin: Plugin
            },
            description: '',
            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            length: 1,
            name: 'Chrome PDF Viewer'
          }
        ]
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Hide automation indicators
      delete window.navigator.__proto__.webdriver;

      // Mock chrome runtime
      window.chrome = {
        runtime: {
          onConnect: undefined,
          onMessage: undefined,
        },
        app: {
          isInstalled: false,
        }
      };

      // Advanced canvas fingerprint protection
      const getImageData = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/png' && this.width === 280 && this.height === 30) {
          return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAAeCAYAAACZhkT5AAAAAXNSR0IArs4c6QAAAnJJREFUeF7t1...';
        }
        return getImageData.apply(this, arguments);
      };
    });

    logger.info('Anti-detection scripts injected');
  }

  async rotateProxy() {
    if (!this.options.proxyRotation || this.proxies.length === 0) {
      return null;
    }

    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    const proxy = this.proxies[this.currentProxyIndex];

    logger.info(`Rotating to proxy: ${proxy.server}`);
    return proxy;
  }

  async createRecordingSession(url, sessionId) {
    logger.info(`Starting recording session: ${sessionId} for ${url}`);

    const browser = await this.launchStealthyBrowser(sessionId);
    const context = await this.createStealthyContext(browser, sessionId);

    // Enable tracing for comprehensive recording
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true
    });

    const page = await context.newPage();

    // Setup recording listeners
    this.setupRecordingListeners(page, sessionId);

    return { browser, context, page };
  }

  setupRecordingListeners(page, sessionId) {
    const recordings = {
      clicks: [],
      navigations: [],
      networkRequests: [],
      responses: [],
      errors: [],
      consoleMessages: []
    };

    // Record clicks with coordinates
    page.on('click', async (element) => {
      const box = await element.boundingBox();
      recordings.clicks.push({
        timestamp: Date.now(),
        element: await element.evaluate(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          textContent: el.textContent?.substring(0, 100)
        })),
        coordinates: box ? { x: box.x + box.width/2, y: box.y + box.height/2 } : null,
        selector: await this.generateSelector(element)
      });
    });

    // Record navigation
    page.on('framenavigated', (frame) => {
      recordings.navigations.push({
        timestamp: Date.now(),
        url: frame.url(),
        name: frame.name()
      });
    });

    // Record network requests
    page.on('request', (request) => {
      recordings.networkRequests.push({
        timestamp: Date.now(),
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        resourceType: request.resourceType()
      });
    });

    // Record responses
    page.on('response', (response) => {
      recordings.responses.push({
        timestamp: Date.now(),
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        fromCache: false, // API deprecated in newer Playwright versions
        fromServiceWorker: false // API deprecated in newer Playwright versions
      });
    });

    // Record console messages
    page.on('console', (message) => {
      recordings.consoleMessages.push({
        timestamp: Date.now(),
        type: message.type(),
        text: message.text(),
        location: message.location()
      });
    });

    // Save recordings periodically
    setInterval(() => {
      this.saveRecording(sessionId, recordings);
    }, 30000); // Save every 30 seconds

    this.currentRecordings = recordings;
  }

  async generateSelector(element) {
    return await element.evaluate((el) => {
      // Generate multiple selector strategies
      const selectors = [];

      // ID selector
      if (el.id) {
        selectors.push(`#${el.id}`);
      }

      // Class selector
      if (el.className) {
        selectors.push(`.${el.className.split(' ').join('.')}`);
      }

      // Data attribute selector
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-')) {
          selectors.push(`[${attr.name}="${attr.value}"]`);
        }
      }

      // Text content selector
      if (el.textContent && el.textContent.length < 50) {
        selectors.push(`text=${el.textContent.trim()}`);
      }

      // XPath selector
      const getXPath = (element) => {
        if (element.id) {
          return `//*[@id="${element.id}"]`;
        }
        if (element === document.body) {
          return '/html/body';
        }

        let ix = 0;
        const siblings = element.parentNode?.childNodes || [];
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          if (sibling === element) {
            return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
          }
          if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
          }
        }
      };

      selectors.push(getXPath(el));

      return {
        primary: selectors[0],
        fallbacks: selectors.slice(1)
      };
    });
  }

  async saveRecording(sessionId, recordings) {
    const fs = require('fs-extra');
    const recordingPath = `recordings/${sessionId}_${Date.now()}.json`;

    await fs.ensureDir('recordings');
    await fs.writeJson(recordingPath, recordings, { spaces: 2 });

    logger.info(`Recording saved: ${recordingPath}`);
  }

  async cleanup(sessionId) {
    const browserId = `browser_${sessionId}`;
    const contextId = `context_${sessionId}`;

    if (this.contexts.has(contextId)) {
      const context = this.contexts.get(contextId);
      await context.tracing.stop({ path: `recordings/trace_${sessionId}.zip` });
      await context.close();
      this.contexts.delete(contextId);
    }

    if (this.browsers.has(browserId)) {
      const browser = this.browsers.get(browserId);
      await browser.close();
      this.browsers.delete(browserId);
    }

    logger.info(`Cleaned up session: ${sessionId}`);
  }
}

export default BrowserManager;