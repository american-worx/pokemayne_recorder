import BrowserManager from '../core/browser-manager.js';
import logger from '../core/utils/logger.js';
import fs from 'fs-extra';
import path from 'path';

class StealthyRecorder {
  constructor(options = {}) {
    this.options = {
      sessionId: options.sessionId || `session_${Date.now()}`,
      outputDir: options.outputDir || 'recordings',
      captureScreenshots: options.captureScreenshots ?? true,
      captureNetwork: options.captureNetwork ?? true,
      captureConsole: options.captureConsole ?? true,
      captureCookies: options.captureCookies ?? true,
      captureLocalStorage: options.captureLocalStorage ?? true,
      captureClicks: options.captureClicks ?? true,
      captureKeystrokes: options.captureKeystrokes ?? true,
      autoSave: options.autoSave ?? true,
      saveInterval: options.saveInterval || 30000,
      ...options
    };

    this.browserManager = new BrowserManager({
      headless: this.options.headless ?? true, // Default to headless for server environments
      recordingMode: true,
      stealthLevel: 'ultra'
    });

    this.recordingData = {
      session: {
        id: this.options.sessionId,
        startTime: Date.now(),
        url: null,
        userAgent: null,
        viewport: null
      },
      actions: [],
      network: {
        requests: [],
        responses: [],
        websockets: []
      },
      console: [],
      errors: [],
      screenshots: [],
      dom: {
        snapshots: [],
        mutations: []
      },
      security: {
        captchas: [],
        challenges: [],
        redirects: [],
        cookies: [],
        localStorage: {},
        sessionStorage: {}
      },
      performance: {
        navigationTiming: [],
        resourceTiming: [],
        paintTiming: []
      }
    };

    this.isRecording = false;
    this.page = null;
    this.context = null;
    this.browser = null;
  }

  async startRecording(url) {
    logger.recordAction('start_recording', { url, sessionId: this.options.sessionId });

    try {
      // Launch browser and create context
      const { browser, context, page } = await this.browserManager.createRecordingSession(url, this.options.sessionId);

      this.browser = browser;
      this.context = context;
      this.page = page;

      // Set up all recording listeners
      await this.setupRecordingListeners();

      // Navigate to the URL
      await page.goto(url, { waitUntil: 'networkidle' });

      this.recordingData.session.url = url;
      this.recordingData.session.userAgent = await page.evaluate(() => navigator.userAgent);
      this.recordingData.session.viewport = page.viewportSize();

      this.isRecording = true;

      // Start auto-save interval
      if (this.options.autoSave) {
        this.autoSaveInterval = setInterval(() => {
          this.saveRecording();
        }, this.options.saveInterval);
      }

      logger.recordAction('recording_started', {
        url,
        sessionId: this.options.sessionId,
        userAgent: this.recordingData.session.userAgent,
        viewport: this.recordingData.session.viewport
      });

      return { browser, context, page };
    } catch (error) {
      logger.recordError(error, { url, sessionId: this.options.sessionId });
      throw error;
    }
  }

  async setupRecordingListeners() {
    // Click recording with advanced details
    if (this.options.captureClicks) {
      await this.page.exposeFunction('recordClick', (clickData) => {
        this.recordingData.actions.push({
          type: 'click',
          timestamp: Date.now(),
          ...clickData
        });
      });

      await this.page.addInitScript(() => {
        document.addEventListener('click', async (event) => {
          const element = event.target;

          // Generate comprehensive selector data
          const selectors = {
            id: element.id || null,
            className: element.className || null,
            tagName: element.tagName?.toLowerCase(),
            textContent: element.textContent?.trim().substring(0, 100),
            xpath: this.getXPath(element),
            cssSelector: this.getCSSSelector(element)
          };

          // Get element position and size
          const rect = element.getBoundingClientRect();
          const coordinates = {
            x: event.clientX,
            y: event.clientY,
            elementX: rect.left + rect.width / 2,
            elementY: rect.top + rect.height / 2,
            screenX: event.screenX,
            screenY: event.screenY
          };

          // Get element attributes
          const attributes = {};
          for (let attr of element.attributes) {
            attributes[attr.name] = attr.value;
          }

          window.recordClick({
            selectors,
            coordinates,
            attributes,
            href: element.href || null,
            value: element.value || null,
            form: element.form ? {
              id: element.form.id,
              action: element.form.action,
              method: element.form.method
            } : null
          });
        });

        // Helper functions for selectors
        window.getXPath = (element) => {
          if (element.id) return `//*[@id="${element.id}"]`;
          if (element === document.body) return '/html/body';

          let ix = 0;
          const siblings = element.parentNode?.childNodes || [];
          for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
              return this.getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
              ix++;
            }
          }
        };

        window.getCSSSelector = (element) => {
          if (element.id) return `#${element.id}`;

          let selector = element.tagName.toLowerCase();
          if (element.className) {
            selector += '.' + element.className.split(' ').join('.');
          }

          return selector;
        };
      });
    }

    // Keystroke recording
    if (this.options.captureKeystrokes) {
      await this.page.exposeFunction('recordKeystroke', (keystrokeData) => {
        this.recordingData.actions.push({
          type: 'keystroke',
          timestamp: Date.now(),
          ...keystrokeData
        });
      });

      await this.page.addInitScript(() => {
        document.addEventListener('keydown', (event) => {
          window.recordKeystroke({
            key: event.key,
            code: event.code,
            keyCode: event.keyCode,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            target: {
              tagName: event.target.tagName,
              id: event.target.id,
              className: event.target.className,
              name: event.target.name,
              type: event.target.type
            }
          });
        });
      });
    }

    // Network request/response recording
    if (this.options.captureNetwork) {
      this.page.on('request', (request) => {
        this.recordingData.network.requests.push({
          timestamp: Date.now(),
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
          resourceType: request.resourceType(),
          isNavigationRequest: request.isNavigationRequest(),
          frame: request.frame().url()
        });
      });

      this.page.on('response', async (response) => {
        try {
          const responseData = {
            timestamp: Date.now(),
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            fromCache: false, // API deprecated in newer Playwright versions
            fromServiceWorker: false, // API deprecated in newer Playwright versions
            securityDetails: response.securityDetails(),
            timing: response.timing()
          };

          // Capture response body for important requests
          if (this.isImportantRequest(response.url())) {
            try {
              responseData.body = await response.text();
            } catch (e) {
              responseData.bodyError = e.message;
            }
          }

          this.recordingData.network.responses.push(responseData);
        } catch (error) {
          logger.recordError(error, { context: 'response_recording', url: response.url() });
        }
      });
    }

    // Console recording
    if (this.options.captureConsole) {
      this.page.on('console', (message) => {
        this.recordingData.console.push({
          timestamp: Date.now(),
          type: message.type(),
          text: message.text(),
          location: message.location(),
          args: message.args().map(arg => arg.toString())
        });
      });
    }

    // Error recording
    this.page.on('pageerror', (error) => {
      this.recordingData.errors.push({
        timestamp: Date.now(),
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    });

    // CAPTCHA and security challenge detection
    await this.setupSecurityDetection();

    // Performance monitoring
    await this.setupPerformanceMonitoring();

    // DOM mutation recording
    await this.setupDOMRecording();

    logger.recordAction('listeners_setup', { sessionId: this.options.sessionId });
  }

  async setupSecurityDetection() {
    await this.page.addInitScript(() => {
      // CAPTCHA detection
      const captchaSelectors = [
        '.g-recaptcha',
        '.h-captcha',
        '[data-testid="captcha"]',
        '.captcha',
        '#captcha',
        '.challenge-container',
        '.cf-challenge'
      ];

      const checkForCaptcha = () => {
        captchaSelectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element && element.offsetHeight > 0) {
            window.captchaDetected && window.captchaDetected({
              type: 'captcha',
              selector,
              siteKey: element.getAttribute('data-sitekey'),
              timestamp: Date.now()
            });
          }
        });
      };

      // Check for CAPTCHAs periodically
      setInterval(checkForCaptcha, 1000);

      // Check on DOM changes
      const observer = new MutationObserver(checkForCaptcha);
      observer.observe(document.body, { childList: true, subtree: true });
    });

    await this.page.exposeFunction('captchaDetected', (captchaData) => {
      this.recordingData.security.captchas.push(captchaData);
      logger.recordAction('captcha_detected', captchaData);
    });

    // Redirect detection
    this.page.on('framenavigated', (frame) => {
      if (frame === this.page.mainFrame()) {
        this.recordingData.security.redirects.push({
          timestamp: Date.now(),
          url: frame.url(),
          type: 'navigation'
        });
      }
    });
  }

  async setupPerformanceMonitoring() {
    await this.page.addInitScript(() => {
      // Navigation timing
      window.addEventListener('load', () => {
        const timing = performance.getEntriesByType('navigation')[0];
        window.performanceData && window.performanceData({
          type: 'navigation',
          timing: timing.toJSON()
        });
      });

      // Resource timing
      setInterval(() => {
        const resources = performance.getEntriesByType('resource');
        window.performanceData && window.performanceData({
          type: 'resources',
          resources: resources.map(r => r.toJSON())
        });
      }, 5000);
    });

    await this.page.exposeFunction('performanceData', (perfData) => {
      if (perfData.type === 'navigation') {
        this.recordingData.performance.navigationTiming.push({
          timestamp: Date.now(),
          ...perfData.timing
        });
      } else if (perfData.type === 'resources') {
        this.recordingData.performance.resourceTiming.push({
          timestamp: Date.now(),
          resources: perfData.resources
        });
      }
    });
  }

  async setupDOMRecording() {
    await this.page.addInitScript(() => {
      // DOM mutation observer
      const observer = new MutationObserver((mutations) => {
        const relevantMutations = mutations.filter(mutation => {
          // Filter out non-important mutations
          return mutation.type === 'childList' &&
                 (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0);
        }).map(mutation => ({
          type: mutation.type,
          target: {
            tagName: mutation.target.tagName,
            id: mutation.target.id,
            className: mutation.target.className
          },
          addedNodes: Array.from(mutation.addedNodes).map(node => ({
            nodeType: node.nodeType,
            tagName: node.tagName,
            textContent: node.textContent?.substring(0, 100)
          })),
          removedNodes: Array.from(mutation.removedNodes).map(node => ({
            nodeType: node.nodeType,
            tagName: node.tagName,
            textContent: node.textContent?.substring(0, 100)
          }))
        }));

        if (relevantMutations.length > 0) {
          window.domMutation && window.domMutation(relevantMutations);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true
      });
    });

    await this.page.exposeFunction('domMutation', (mutations) => {
      this.recordingData.dom.mutations.push({
        timestamp: Date.now(),
        mutations
      });
    });
  }

  async captureSessionData() {
    if (!this.page) return;

    try {
      // Capture cookies
      if (this.options.captureCookies) {
        const cookies = await this.context.cookies();
        this.recordingData.security.cookies = cookies;
      }

      // Capture localStorage
      if (this.options.captureLocalStorage) {
        const localStorage = await this.page.evaluate(() => {
          const data = {};
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            data[key] = window.localStorage.getItem(key);
          }
          return data;
        });
        this.recordingData.security.localStorage = localStorage;
      }

      // Capture sessionStorage
      const sessionStorage = await this.page.evaluate(() => {
        const data = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          data[key] = window.sessionStorage.getItem(key);
        }
        return data;
      });
      this.recordingData.security.sessionStorage = sessionStorage;

      // Capture current DOM snapshot
      const domSnapshot = await this.page.evaluate(() => {
        return {
          html: document.documentElement.outerHTML,
          url: window.location.href,
          title: document.title
        };
      });
      this.recordingData.dom.snapshots.push({
        timestamp: Date.now(),
        ...domSnapshot
      });

    } catch (error) {
      logger.recordError(error, { context: 'session_data_capture' });
    }
  }

  async takeScreenshot() {
    if (!this.options.captureScreenshots || !this.page) return;

    try {
      const screenshotPath = path.join(this.options.outputDir, this.options.sessionId, 'screenshots', `${Date.now()}.png`);
      await fs.ensureDir(path.dirname(screenshotPath));

      const screenshot = await this.page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      this.recordingData.screenshots.push({
        timestamp: Date.now(),
        path: screenshotPath,
        size: screenshot.length
      });

      return screenshotPath;
    } catch (error) {
      logger.recordError(error, { context: 'screenshot_capture' });
    }
  }

  isImportantRequest(url) {
    const importantPatterns = [
      '/cart',
      '/checkout',
      '/api/',
      '/graphql',
      'add-to-cart',
      'inventory',
      'captcha',
      'challenge'
    ];

    return importantPatterns.some(pattern => url.includes(pattern));
  }

  async saveRecording() {
    try {
      await this.captureSessionData();

      const outputPath = path.join(this.options.outputDir, this.options.sessionId);
      await fs.ensureDir(outputPath);

      // Save main recording data
      const recordingPath = path.join(outputPath, 'recording.json');
      await fs.writeJson(recordingPath, this.recordingData, { spaces: 2 });

      // Save Playwright trace
      if (this.context) {
        const tracePath = path.join(outputPath, 'trace.zip');
        await this.context.tracing.stop({ path: tracePath });
        await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
      }

      logger.recordAction('recording_saved', {
        path: recordingPath,
        sessionId: this.options.sessionId,
        actions: this.recordingData.actions.length,
        requests: this.recordingData.network.requests.length,
        responses: this.recordingData.network.responses.length
      });

      return recordingPath;
    } catch (error) {
      logger.recordError(error, { context: 'save_recording' });
      throw error;
    }
  }

  async stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;

    // Clear auto-save interval
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    // Take final screenshot
    await this.takeScreenshot();

    // Save final recording
    const recordingPath = await this.saveRecording();

    // Cleanup browser resources
    await this.browserManager.cleanup(this.options.sessionId);

    logger.recordAction('recording_stopped', {
      sessionId: this.options.sessionId,
      duration: Date.now() - this.recordingData.session.startTime,
      recordingPath
    });

    return {
      sessionId: this.options.sessionId,
      recordingPath,
      duration: Date.now() - this.recordingData.session.startTime,
      stats: {
        actions: this.recordingData.actions.length,
        requests: this.recordingData.network.requests.length,
        responses: this.recordingData.network.responses.length,
        captchas: this.recordingData.security.captchas.length,
        errors: this.recordingData.errors.length
      }
    };
  }
}

export default StealthyRecorder;