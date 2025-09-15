const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');

/**
 * RecorderEngine - Captures user actions and network requests for flow creation
 */
class RecorderEngine {
  constructor(logger) {
    this.logger = logger;
    this.recording = false;
    this.actions = [];
    this.networkLogs = [];
    this.screenshots = [];
    this.startTime = null;
  }

  /**
   * Start recording user actions and network requests
   * @param {Page} page - Playwright page instance
   */
  async startRecording(page) {
    if (this.recording) {
      throw new Error('Recording is already in progress');
    }

    this.recording = true;
    this.actions = [];
    this.networkLogs = [];
    this.screenshots = [];
    this.startTime = Date.now();

    this.logger.info('Starting recording session');

    // Listen for network events
    await this.setupNetworkInterception(page);

    // Listen for user actions
    await this.setupActionListeners(page);

    this.logger.info('Recording session started');
  }

  /**
   * Stop recording and return captured data
   * @returns {Object} - Recorded data
   */
  async stopRecording() {
    if (!this.recording) {
      throw new Error('No recording in progress');
    }

    this.recording = false;
    const duration = Date.now() - this.startTime;

    this.logger.info('Recording session stopped', { duration: `${duration}ms` });

    return {
      actions: this.actions,
      networkLogs: this.networkLogs,
      screenshots: this.screenshots,
      duration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Set up network interception
   * @param {Page} page - Playwright page instance
   */
  async setupNetworkInterception(page) {
    // Listen for network requests
    page.on('request', (request) => {
      if (!this.recording) return;

      this.networkLogs.push({
        id: request.id(),
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: Date.now()
      });
    });

    // Listen for network responses
    page.on('response', async (response) => {
      if (!this.recording) return;

      try {
        const request = response.request();
        const body = await response.text();

        // Find the corresponding request and update it
        const networkLog = this.networkLogs.find(log => log.id === request.id());
        if (networkLog) {
          networkLog.status = response.status();
          networkLog.responseHeaders = response.headers();
          networkLog.responseBody = body;
        }
      } catch (error) {
        this.logger.warn('Failed to capture response body', { error: error.message });
      }
    });

    // Listen for network failures
    page.on('requestfailed', (request) => {
      if (!this.recording) return;

      this.networkLogs.push({
        id: request.id(),
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        failure: request.failure(),
        timestamp: Date.now()
      });
    });
  }

  /**
   * Set up action listeners
   * @param {Page} page - Playwright page instance
   */
  async setupActionListeners(page) {
    // Listen for clicks
    page.on('click', (target) => {
      if (!this.recording) return;

      this.actions.push({
        type: 'click',
        selector: target.selector,
        timestamp: Date.now(),
        url: page.url()
      });
    });

    // For more detailed action capture, we'll use evaluate to inject listeners
    await page.evaluateOnNewDocument(() => {
      // Capture click events
      document.addEventListener('click', (event) => {
        window.recordedActions = window.recordedActions || [];
        window.recordedActions.push({
          type: 'click',
          target: event.target.tagName,
          selector: getCssSelector(event.target),
          x: event.clientX,
          y: event.clientY,
          timestamp: Date.now()
        });
      });

      // Capture input events
      document.addEventListener('input', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
          window.recordedActions = window.recordedActions || [];
          window.recordedActions.push({
            type: 'input',
            target: event.target.tagName,
            selector: getCssSelector(event.target),
            value: event.target.value,
            timestamp: Date.now()
          });
        }
      });

      // Simple CSS selector generator
      function getCssSelector(element) {
        if (element.id) {
          return `#${element.id}`;
        }
        
        const parts = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
          let selector = element.nodeName.toLowerCase();
          
          if (element.id) {
            selector += `#${element.id}`;
            parts.unshift(selector);
            break;
          } else {
            let sibling = element;
            let nth = 1;
            
            while (sibling.previousElementSibling) {
              sibling = sibling.previousElementSibling;
              if (sibling.nodeName.toLowerCase() === selector) {
                nth++;
              }
            }
            
            if (nth !== 1) {
              selector += `:nth-of-type(${nth})`;
            }
          }
          
          parts.unshift(selector);
          element = element.parentNode;
        }
        
        return parts.join(' > ');
      }
    });
  }

  /**
   * Capture a screenshot
   * @param {Page} page - Playwright page instance
   * @param {string} name - Screenshot name
   */
  async captureScreenshot(page, name) {
    if (!this.recording) {
      throw new Error('No recording in progress');
    }

    try {
      const screenshot = await page.screenshot({ encoding: 'base64' });
      this.screenshots.push({
        name: name || `screenshot-${Date.now()}`,
        data: screenshot,
        timestamp: Date.now(),
        url: page.url()
      });

      this.logger.info('Screenshot captured', { name });
    } catch (error) {
      this.logger.error('Failed to capture screenshot', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate HAR file from recorded network data
   * @returns {Object} - HAR format data
   */
  generateHAR() {
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'Pokemayne Recorder',
          version: '1.0'
        },
        entries: this.networkLogs.map(log => ({
          startedDateTime: new Date(log.timestamp).toISOString(),
          time: 0, // We don't have timing info in this simple implementation
          request: {
            method: log.method,
            url: log.url,
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: Object.keys(log.headers || {}).map(name => ({
              name,
              value: log.headers[name]
            })),
            queryString: [],
            postData: log.postData ? {
              mimeType: 'application/x-www-form-urlencoded',
              text: log.postData
            } : undefined,
            headersSize: -1,
            bodySize: log.postData ? log.postData.length : 0
          },
          response: log.status ? {
            status: log.status,
            statusText: '',
            httpVersion: 'HTTP/1.1',
            cookies: [],
            headers: Object.keys(log.responseHeaders || {}).map(name => ({
              name,
              value: log.responseHeaders[name]
            })),
            content: {
              size: log.responseBody ? log.responseBody.length : 0,
              mimeType: 'application/json', // Simplified
              text: log.responseBody || ''
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: log.responseBody ? log.responseBody.length : 0
          } : undefined,
          cache: {},
          timings: {
            send: -1,
            wait: -1,
            receive: -1
          },
          serverIPAddress: '',
          connection: ''
        })),
        pages: [],
        entries: []
      }
    };

    return har;
  }

  /**
   * Save recorded data to files
   * @param {Object} data - Recorded data
   * @param {string} outputPath - Output directory path
   */
  async saveRecording(data, outputPath) {
    try {
      // Ensure output directory exists
      await fs.mkdir(outputPath, { recursive: true });

      // Save actions
      const actionsPath = path.join(outputPath, 'actions.json');
      await fs.writeFile(actionsPath, JSON.stringify(data.actions, null, 2));

      // Save network logs
      const networkPath = path.join(outputPath, 'network.json');
      await fs.writeFile(networkPath, JSON.stringify(data.networkLogs, null, 2));

      // Save HAR file
      const harPath = path.join(outputPath, 'recording.har');
      const harData = this.generateHAR();
      await fs.writeFile(harPath, JSON.stringify(harData, null, 2));

      // Save screenshots
      for (let i = 0; i < data.screenshots.length; i++) {
        const screenshot = data.screenshots[i];
        const screenshotPath = path.join(outputPath, `${screenshot.name}.png`);
        await fs.writeFile(screenshotPath, screenshot.data, 'base64');
      }

      this.logger.info('Recording saved', { outputPath });
    } catch (error) {
      this.logger.error('Failed to save recording', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if recording is in progress
   * @returns {boolean} - Whether recording is in progress
   */
  isRecording() {
    return this.recording;
  }

  /**
   * Get recorded actions
   * @returns {Array} - Recorded actions
   */
  getActions() {
    return this.actions;
  }

  /**
   * Get network logs
   * @returns {Array} - Network logs
   */
  getNetworkLogs() {
    return this.networkLogs;
  }

  /**
   * Get screenshots
   * @returns {Array} - Screenshots
   */
  getScreenshots() {
    return this.screenshots;
  }
}

module.exports = RecorderEngine;