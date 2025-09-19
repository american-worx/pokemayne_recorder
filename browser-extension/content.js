// Pokemayne Recorder - Content Script
// Captures user interactions with maximum stealth

class StealthRecorder {
  constructor() {
    this.isRecording = false;
    this.sessionId = null;
    this.injectedScript = null;
    this.lastActivity = Date.now();

    // Stealth: Use random intervals to avoid detection
    this.captureInterval = 100 + Math.random() * 100; // 100-200ms

    this.initializeRecorder();
  }

  initializeRecorder() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message);
      sendResponse({ received: true });
    });

    // Stealth: Avoid obvious event listeners by using capture phase
    this.setupStealthListeners();

    console.log('🎯 Pokemayne content script loaded on:', window.location.href);
  }

  handleMessage(message) {
    console.log('🎯 Content script received message:', message.type, message);
    switch (message.type) {
      case 'start_recording':
        this.startRecording(message.sessionId, message.config, message.resuming);
        break;
      case 'stop_recording':
        this.stopRecording();
        break;
    }
  }

  startRecording(sessionId, config = {}, resuming = false) {
    if (this.isRecording && !resuming) return;

    this.isRecording = true;
    this.sessionId = sessionId;
    this.lastActivity = Date.now();

    // Inject stealth recording script
    this.injectStealthScript();

    // Start monitoring
    this.startMonitoring();

    console.log('🎬 Recording started in tab:', sessionId, 'on URL:', window.location.href);
  }

  stopRecording() {
    this.isRecording = false;
    this.sessionId = null;

    // Remove injected script
    if (this.injectedScript) {
      this.injectedScript.remove();
      this.injectedScript = null;
    }

    // Clean up listeners
    this.stopMonitoring();

    console.debug('🛑 Recording stopped in tab');
  }

  injectStealthScript() {
    // Remove existing script if any
    if (this.injectedScript) {
      this.injectedScript.remove();
    }

    // Create and inject stealth script
    this.injectedScript = document.createElement('script');
    this.injectedScript.src = chrome.runtime.getURL('injected.js');
    this.injectedScript.async = true;

    // Stealth: Inject at different positions randomly
    const target = document.head || document.documentElement;
    if (Math.random() > 0.5) {
      target.appendChild(this.injectedScript);
    } else {
      target.insertBefore(this.injectedScript, target.firstChild);
    }
  }

  setupStealthListeners() {
    // Stealth: Use capture phase and passive listeners where possible
    const options = { capture: true, passive: true };

    // Click tracking
    document.addEventListener('click', (event) => {
      if (this.isRecording) {
        this.recordClick(event);
      }
    }, options);

    // Keyboard tracking
    document.addEventListener('keydown', (event) => {
      if (this.isRecording) {
        this.recordKeydown(event);
      }
    }, { capture: true, passive: false }); // Need to be non-passive for key capture

    // Form submissions
    document.addEventListener('submit', (event) => {
      if (this.isRecording) {
        this.recordFormSubmit(event);
      }
    }, options);

    // Navigation
    document.addEventListener('beforeunload', () => {
      if (this.isRecording) {
        this.recordNavigation('beforeunload');
      }
    }, options);

    // Scroll tracking (throttled)
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      if (!this.isRecording) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.recordScroll();
      }, 250); // Throttle scroll events
    }, options);
  }

  startMonitoring() {
    // Monitor for dynamic content changes
    this.setupMutationObserver();

    // Monitor network requests (via injected script)
    this.setupNetworkMonitoring();

    // Monitor console activity
    this.setupConsoleMonitoring();
  }

  stopMonitoring() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  setupMutationObserver() {
    this.mutationObserver = new MutationObserver((mutations) => {
      if (!this.isRecording) return;

      const significantMutations = mutations.filter(mutation => {
        // Filter out insignificant changes to reduce noise
        return mutation.type === 'childList' &&
               mutation.addedNodes.length > 0 &&
               Array.from(mutation.addedNodes).some(node =>
                 node.nodeType === Node.ELEMENT_NODE &&
                 !node.classList.contains('pokemayne-ignore')
               );
      });

      if (significantMutations.length > 0) {
        this.recordDOMChange(significantMutations);
      }
    });

    this.mutationObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  setupNetworkMonitoring() {
    // Network monitoring is handled by the injected script
    // to avoid CORS and other restrictions
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data.type) return;

      if (event.data.type === 'pokemayne_network' && this.isRecording) {
        this.sendToBackground('record_network', event.data.payload);
      }
    });
  }

  setupConsoleMonitoring() {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      if (this.isRecording) {
        this.recordConsole('log', args);
      }
      return originalLog.apply(console, args);
    };

    console.error = (...args) => {
      if (this.isRecording) {
        this.recordConsole('error', args);
      }
      return originalError.apply(console, args);
    };

    console.warn = (...args) => {
      if (this.isRecording) {
        this.recordConsole('warn', args);
      }
      return originalWarn.apply(console, args);
    };
  }

  // Recording methods
  recordClick(event) {
    console.log('🎯 Recording click on:', event.target.tagName, event.target.id || event.target.className);
    const element = event.target;
    const rect = element.getBoundingClientRect();

    const actionData = {
      type: 'click',
      element: {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 100),
        href: element.href,
        value: element.value
      },
      coordinates: {
        x: event.clientX,
        y: event.clientY,
        elementX: event.clientX - rect.left,
        elementY: event.clientY - rect.top
      },
      selectors: this.generateSelectors(element),
      url: window.location.href
    };

    this.sendToBackground('record_action', actionData);
  }

  recordKeydown(event) {
    // Don't record passwords or sensitive inputs
    const isPasswordField = event.target.type === 'password';
    const isSensitiveField = event.target.getAttribute('data-sensitive') === 'true';

    if (isPasswordField || isSensitiveField) {
      return;
    }

    const actionData = {
      type: 'keydown',
      key: event.key,
      code: event.code,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      element: {
        tagName: event.target.tagName,
        id: event.target.id,
        className: event.target.className,
        name: event.target.name,
        type: event.target.type
      },
      selectors: this.generateSelectors(event.target),
      url: window.location.href
    };

    this.sendToBackground('record_action', actionData);
  }

  recordFormSubmit(event) {
    const form = event.target;
    const formData = new FormData(form);
    const data = {};

    // Safely extract non-sensitive form data
    for (const [key, value] of formData.entries()) {
      if (!key.toLowerCase().includes('password') &&
          !key.toLowerCase().includes('secret') &&
          !key.toLowerCase().includes('token')) {
        data[key] = value;
      } else {
        data[key] = '[REDACTED]';
      }
    }

    const actionData = {
      type: 'form_submit',
      form: {
        id: form.id,
        className: form.className,
        action: form.action,
        method: form.method
      },
      data,
      selectors: this.generateSelectors(form),
      url: window.location.href
    };

    this.sendToBackground('record_action', actionData);
  }

  recordNavigation(type) {
    const actionData = {
      type: 'navigation',
      navigationType: type,
      url: window.location.href,
      referrer: document.referrer
    };

    this.sendToBackground('record_action', actionData);
  }

  recordScroll() {
    const actionData = {
      type: 'scroll',
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      url: window.location.href
    };

    this.sendToBackground('record_action', actionData);
  }

  recordDOMChange(mutations) {
    const changeData = {
      type: 'dom_change',
      mutations: mutations.map(mutation => ({
        type: mutation.type,
        addedNodes: mutation.addedNodes.length,
        removedNodes: mutation.removedNodes.length,
        target: {
          tagName: mutation.target.tagName,
          id: mutation.target.id,
          className: mutation.target.className
        }
      })),
      url: window.location.href
    };

    this.sendToBackground('record_action', changeData);
  }

  recordConsole(level, args) {
    const consoleData = {
      level,
      messages: args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      }),
      url: window.location.href
    };

    this.sendToBackground('record_console', consoleData);
  }

  generateSelectors(element) {
    const selectors = [];

    // ID selector
    if (element.id) {
      selectors.push(`#${element.id}`);
    }

    // Class selector
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selectors.push(`.${classes.join('.')}`);
      }
    }

    // Attribute selectors
    ['name', 'data-testid', 'data-test', 'aria-label'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        selectors.push(`[${attr}="${value}"]`);
      }
    });

    // XPath
    selectors.push(this.generateXPath(element));

    return selectors;
  }

  generateXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentNode?.children || [])
        .filter(child => child.tagName === current.tagName);

      const index = siblings.indexOf(current) + 1;
      const part = siblings.length > 1 ? `${tagName}[${index}]` : tagName;

      parts.unshift(part);
      current = current.parentNode;
    }

    return '/' + parts.join('/');
  }

  sendToBackground(type, data) {
    const message = {
      type,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };
    console.log('🎯 Sending to background:', type, message);
    chrome.runtime.sendMessage(message).catch((error) => {
      console.error('Failed to send message to background:', error);
    });
  }
}

// Initialize stealth recorder
const stealthRecorder = new StealthRecorder();