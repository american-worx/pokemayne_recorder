// Pokemayne Recorder - Injected Script
// Runs in page context for maximum stealth and network access

(function() {
  'use strict';

  // Avoid multiple injections
  if (window.pokemayneRecorderInjected) {
    return;
  }
  window.pokemayneRecorderInjected = true;

  class NetworkMonitor {
    constructor() {
      this.originalFetch = window.fetch;
      this.originalXHROpen = XMLHttpRequest.prototype.open;
      this.originalXHRSend = XMLHttpRequest.prototype.send;

      this.setupNetworkInterception();
    }

    setupNetworkInterception() {
      // Intercept fetch requests
      window.fetch = async (...args) => {
        const startTime = Date.now();
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        const options = args[1] || {};

        try {
          const response = await this.originalFetch.apply(window, args);

          this.recordNetworkRequest({
            type: 'fetch',
            url,
            method: options.method || 'GET',
            headers: this.headersToObject(options.headers),
            status: response.status,
            statusText: response.statusText,
            responseHeaders: this.headersToObject(response.headers),
            duration: Date.now() - startTime,
            timestamp: startTime
          });

          return response;
        } catch (error) {
          this.recordNetworkRequest({
            type: 'fetch',
            url,
            method: options.method || 'GET',
            headers: this.headersToObject(options.headers),
            error: error.message,
            duration: Date.now() - startTime,
            timestamp: startTime
          });

          throw error;
        }
      };

      // Intercept XMLHttpRequest
      const monitor = this;

      XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._pokemayne = {
          method,
          url,
          startTime: Date.now(),
          headers: {}
        };

        return monitor.originalXHROpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function(data) {
        const xhr = this;
        const pokemayne = this._pokemayne;

        if (pokemayne) {
          // Capture request headers
          const originalSetRequestHeader = this.setRequestHeader;
          this.setRequestHeader = function(header, value) {
            pokemayne.headers[header] = value;
            return originalSetRequestHeader.apply(this, arguments);
          };

          // Listen for response
          const originalOnReadyStateChange = this.onreadystatechange;
          this.onreadystatechange = function() {
            if (this.readyState === 4) {
              monitor.recordNetworkRequest({
                type: 'xhr',
                url: pokemayne.url,
                method: pokemayne.method,
                headers: pokemayne.headers,
                status: this.status,
                statusText: this.statusText,
                responseHeaders: monitor.parseResponseHeaders(this.getAllResponseHeaders()),
                duration: Date.now() - pokemayne.startTime,
                timestamp: pokemayne.startTime
              });
            }

            if (originalOnReadyStateChange) {
              return originalOnReadyStateChange.apply(this, arguments);
            }
          };
        }

        return monitor.originalXHRSend.apply(this, arguments);
      };
    }

    headersToObject(headers) {
      if (!headers) return {};

      if (headers instanceof Headers) {
        const obj = {};
        for (const [key, value] of headers.entries()) {
          obj[key] = value;
        }
        return obj;
      }

      return headers;
    }

    parseResponseHeaders(headerString) {
      const headers = {};
      if (!headerString) return headers;

      headerString.split('\r\n').forEach(line => {
        const parts = line.split(': ');
        if (parts.length === 2) {
          headers[parts[0]] = parts[1];
        }
      });

      return headers;
    }

    recordNetworkRequest(data) {
      // Send to content script
      window.postMessage({
        type: 'pokemayne_network',
        payload: data
      }, '*');
    }
  }

  // Initialize network monitoring
  const networkMonitor = new NetworkMonitor();

  // Stealth: Override common detection methods
  const stealthMethods = {
    // Hide webdriver property
    hideWebDriver() {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });
    },

    // Spoof plugin array
    spoofPlugins() {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            name: 'Chrome PDF Plugin',
            filename: 'internal-pdf-viewer',
            description: 'Portable Document Format'
          },
          {
            name: 'Chrome PDF Viewer',
            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            description: ''
          }
        ],
        configurable: true
      });
    },

    // Spoof languages
    spoofLanguages() {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true
      });
    },

    // Hide automation flags
    hideAutomationFlags() {
      // Remove automation-related properties
      delete window.chrome?.runtime?.onConnect;
      delete window.chrome?.runtime?.onMessage;

      // Override chrome property partially
      if (window.chrome) {
        Object.defineProperty(window.chrome, 'runtime', {
          get: () => ({
            connect: undefined,
            sendMessage: undefined
          }),
          configurable: true
        });
      }
    },

    // Randomize timing
    addTimingJitter() {
      const originalSetTimeout = window.setTimeout;
      const originalSetInterval = window.setInterval;

      window.setTimeout = function(callback, delay, ...args) {
        const jitter = Math.random() * 10 - 5; // ±5ms jitter
        return originalSetTimeout(callback, delay + jitter, ...args);
      };

      window.setInterval = function(callback, delay, ...args) {
        const jitter = Math.random() * 10 - 5; // ±5ms jitter
        return originalSetInterval(callback, delay + jitter, ...args);
      };
    }
  };

  // Apply stealth methods
  try {
    stealthMethods.hideWebDriver();
    stealthMethods.spoofPlugins();
    stealthMethods.spoofLanguages();
    stealthMethods.hideAutomationFlags();
    stealthMethods.addTimingJitter();
  } catch (error) {
    // Stealth: Silently fail if stealth methods don't work
    console.debug('Stealth method failed:', error);
  }

  // Add subtle marker for content script
  Object.defineProperty(window, 'pokemayneStealthActive', {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false
  });

})();