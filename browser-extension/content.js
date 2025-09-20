// Pokemayne Recorder - Content Script
// Captures user interactions with maximum stealth

class StealthRecorder {
  constructor() {
    this.isRecording = false;
    this.sessionId = null;
    this.injectedScript = null;
    this.lastActivity = Date.now();
    this.stepCounter = 0;
    this.recordingStartTime = null;
    this.lastStepTime = null;
    this.pendingNetworkRequests = new Map();
    this.recentNetworkActivity = [];
    this.viewportInfo = {
      width: window.innerWidth,
      height: window.innerHeight,
      deviceScaleFactor: window.devicePixelRatio || 1,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      hasTouch: 'ontouchstart' in window,
      isLandscape: window.innerWidth > window.innerHeight
    };

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
        console.log('🎬 Starting recording with sessionId:', message.sessionId);
        this.startRecording(message.sessionId, message.config, message.resuming);
        break;
      case 'stop_recording':
        console.log('🛑 Stopping recording');
        this.stopRecording();
        break;
    }
  }

  startRecording(sessionId, config = {}, resuming = false) {
    if (this.isRecording && !resuming) return;

    this.isRecording = true;
    this.sessionId = sessionId;
    this.lastActivity = Date.now();
    this.recordingStartTime = Date.now();
    this.lastStepTime = Date.now();
    this.stepCounter = 0;
    this.pendingNetworkRequests.clear();
    this.recentNetworkActivity = [];

    // Update viewport info
    this.updateViewportInfo();

    // Record initial viewport setup
    this.recordInitialState();

    // Inject stealth recording script
    this.injectStealthScript();

    // Start monitoring
    this.startMonitoring();

    console.log('🎬 Recording started in tab:', sessionId, 'on URL:', window.location.href);
  }

  stopRecording() {
    this.isRecording = false;

    // Export recording in Chrome DevTools format before cleanup
    this.exportRecording();

    this.sessionId = null;

    // Remove injected script
    if (this.injectedScript) {
      this.injectedScript.remove();
      this.injectedScript = null;
    }

    // Clean up listeners
    this.stopMonitoring();

    // Restore original console methods
    this.restoreConsole();

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
      console.log('🎯 Click detected, isRecording:', this.isRecording, 'sessionId:', this.sessionId);
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

    // Navigation tracking
    let currentUrl = window.location.href;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override history methods
    history.pushState = (...args) => {
      const result = originalPushState.apply(history, args);
      if (this.isRecording && window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.recordNavigation(currentUrl, document.title);
      }
      return result;
    };

    history.replaceState = (...args) => {
      const result = originalReplaceState.apply(history, args);
      if (this.isRecording && window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.recordNavigation(currentUrl, document.title);
      }
      return result;
    };

    // Listen for popstate (back/forward)
    window.addEventListener('popstate', () => {
      if (this.isRecording && window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.recordNavigation(currentUrl, document.title);
      }
    }, options);

    // Track page unload
    document.addEventListener('beforeunload', () => {
      if (this.isRecording) {
        this.recordNavigation('about:blank', 'Navigating away');
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
        // Store network activity for correlation
        this.recentNetworkActivity.push({
          ...event.data.payload,
          timestamp: Date.now()
        });

        // Keep only last 50 requests to prevent memory issues
        if (this.recentNetworkActivity.length > 50) {
          this.recentNetworkActivity = this.recentNetworkActivity.slice(-25);
        }

        this.sendToBackground('record_network', event.data.payload);
      }
    });
  }

  setupConsoleMonitoring() {
    // Store original console methods for restoration
    if (!this.originalConsole) {
      this.originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn
      };
    }

    console.log = (...args) => {
      if (this.isRecording) {
        try {
          this.recordConsole('log', args);
        } catch (e) {
          // Prevent console recording from crashing the page
        }
      }
      return this.originalConsole.log.apply(console, args);
    };

    console.error = (...args) => {
      if (this.isRecording) {
        try {
          this.recordConsole('error', args);
        } catch (e) {
          // Prevent console recording from crashing the page
        }
      }
      return this.originalConsole.error.apply(console, args);
    };

    console.warn = (...args) => {
      if (this.isRecording) {
        try {
          this.recordConsole('warn', args);
        } catch (e) {
          // Prevent console recording from crashing the page
        }
      }
      return this.originalConsole.warn.apply(console, args);
    };
  }

  restoreConsole() {
    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.error = this.originalConsole.error;
      console.warn = this.originalConsole.warn;
      this.originalConsole = null;
    }
  }

  // Enhanced recording methods
  recordClick(event) {
    console.log('🎯 Recording click on:', event.target.tagName, event.target.id || event.target.className);
    const element = event.target;
    const rect = element.getBoundingClientRect();
    const now = Date.now();
    const duration = this.lastStepTime ? now - this.lastStepTime : 0;

    const actionData = {
      type: 'click',
      target: window.location.href,
      selectors: this.generateAdvancedSelectors(element),
      offsetX: Math.round(event.clientX - rect.left),
      offsetY: Math.round(event.clientY - rect.top),
      duration: duration > 1000 ? duration : undefined, // Only include if > 1s
      timestamp: now,
      stepNumber: ++this.stepCounter,
      element: {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 100),
        href: element.href,
        value: element.value,
        attributes: this.getRelevantAttributes(element)
      },
      coordinates: {
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
        screenX: event.screenX,
        screenY: event.screenY
      },
      networkActivity: this.getRecentNetworkActivity(),
      url: window.location.href,
      viewport: this.viewportInfo
    };

    this.lastStepTime = now;
    this.sendToBackground('record_action', actionData);
  }

  recordKeydown(event) {
    // Don't record passwords or sensitive inputs
    const isPasswordField = event.target.type === 'password';
    const isSensitiveField = event.target.getAttribute('data-sensitive') === 'true';

    if (isPasswordField || isSensitiveField) {
      return;
    }

    const now = Date.now();
    const duration = this.lastStepTime ? now - this.lastStepTime : 0;

    const actionData = {
      type: 'keyDown',
      target: window.location.href,
      key: event.key,
      code: event.code,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      timestamp: now,
      stepNumber: ++this.stepCounter,
      duration: duration > 1000 ? duration : undefined,
      element: {
        tagName: event.target.tagName,
        id: event.target.id,
        className: event.target.className,
        name: event.target.name,
        type: event.target.type,
        attributes: this.getRelevantAttributes(event.target)
      },
      selectors: this.generateAdvancedSelectors(event.target),
      networkActivity: this.getRecentNetworkActivity(),
      url: window.location.href
    };

    this.lastStepTime = now;
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

  recordNavigation(url, title = '') {
    const now = Date.now();
    const duration = this.lastStepTime ? now - this.lastStepTime : 0;

    const navigationData = {
      type: 'navigate',
      url: url,
      assertedEvents: [{
        type: 'navigation',
        url: url,
        title: title || document.title
      }],
      timestamp: now,
      stepNumber: ++this.stepCounter,
      duration: duration > 1000 ? duration : undefined,
      networkActivity: this.getRecentNetworkActivity()
    };

    this.lastStepTime = now;
    this.sendToBackground('record_action', navigationData);
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
    // Prevent infinite recursion by checking if we're already processing DOM changes
    if (this.processingDOMChange) return;
    this.processingDOMChange = true;

    try {
      const changeData = {
        type: 'dom_change',
        mutations: mutations.slice(0, 10).map(mutation => ({ // Limit to 10 mutations max
          type: mutation.type,
          addedNodes: mutation.addedNodes.length,
          removedNodes: mutation.removedNodes.length,
          target: {
            tagName: mutation.target?.tagName || 'unknown',
            id: mutation.target?.id || '',
            className: mutation.target?.className || ''
          }
        })),
        url: window.location.href
      };

      this.sendToBackground('record_action', changeData);
    } finally {
      // Use setTimeout to prevent immediate re-triggering
      setTimeout(() => {
        this.processingDOMChange = false;
      }, 100);
    }
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

  generateAdvancedSelectors(element) {
    const selectors = [];

    // ARIA selector (highest priority for accessibility)
    const ariaLabel = element.getAttribute('aria-label') || element.getAttribute('aria-labelledby');
    const role = element.getAttribute('role');
    if (ariaLabel) {
      selectors.push([`aria/${ariaLabel}`]);
    } else if (role) {
      selectors.push([`aria/[role="${role}"]`]);
    }

    // Text-based selector for links and buttons
    const textContent = element.textContent?.trim();
    if (textContent && ['A', 'BUTTON', 'INPUT'].includes(element.tagName) && textContent.length < 50) {
      selectors.push([`text/${textContent}`]);
    }

    // CSS selectors array (fallback chain)
    const cssSelectors = [];

    // ID selector (most specific)
    if (element.id && !element.id.includes(' ')) {
      cssSelectors.push(`#${CSS.escape(element.id)}`);
    }

    // Data attributes (test-friendly)
    ['data-testid', 'data-test', 'data-cy', 'data-qa'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        cssSelectors.push(`[${attr}="${value}"]`);
      }
    });

    // Class-based selector
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.trim() && !c.match(/^(active|focus|hover|disabled)$/));
      if (classes.length > 0 && classes.length < 4) {
        cssSelectors.push(`.${classes.map(c => CSS.escape(c)).join('.')}`);
      }
    }

    // Attribute selectors
    ['name', 'type', 'placeholder', 'title'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value && value.length < 50) {
        cssSelectors.push(`[${attr}="${value}"]`);
      }
    });

    // Positional selectors
    if (element.parentNode) {
      const siblings = Array.from(element.parentNode.children).filter(el => el.tagName === element.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        cssSelectors.push(`${element.tagName.toLowerCase()}:nth-of-type(${index})`);
      }
    }

    if (cssSelectors.length > 0) {
      selectors.push(cssSelectors);
    }

    // XPath selector
    const xpath = this.generateXPath(element);
    if (xpath) {
      selectors.push([xpath]);
    }

    // Pierce selectors for shadow DOM
    const pierceSelector = this.generatePierceSelector(element);
    if (pierceSelector) {
      selectors.push([pierceSelector]);
    }

    return selectors;
  }

  generateXPath(element) {
    if (element.id && !element.id.includes(' ')) {
      return `xpath///*[@id="${element.id}"]`;
    }

    // Try to find a unique attribute path first
    const uniqueAttrs = ['data-testid', 'data-test', 'name'];
    for (const attr of uniqueAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        return `xpath///*[@${attr}="${value}"]`;
      }
    }

    const parts = [];
    let current = element;
    let depth = 0;
    const maxDepth = 8; // Shorter paths for better maintainability

    while (current && current.nodeType === Node.ELEMENT_NODE && depth < maxDepth) {
      const tagName = current.tagName.toLowerCase();

      // Check for unique identifiers at this level
      if (current.id && !current.id.includes(' ')) {
        parts.unshift(`*[@id="${current.id}"]`);
        break;
      }

      // Use class if it's stable-looking (no dynamic classes)
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c =>
          c.trim() && !c.match(/^(active|focus|hover|disabled|selected|\d+)$/)
        );
        if (classes.length > 0 && classes.length < 3) {
          const classSelector = classes.map(c => `contains(@class,"${c}")`).join(' and ');
          parts.unshift(`${tagName}[${classSelector}]`);
          depth++;
          current = current.parentNode;
          continue;
        }
      }

      // Fallback to positional
      const siblings = Array.from(current.parentNode?.children || [])
        .filter(child => child.tagName === current.tagName);

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        parts.unshift(`${tagName}[${index}]`);
      } else {
        parts.unshift(tagName);
      }

      current = current.parentNode;
      depth++;
    }

    return 'xpath//' + parts.join('/');
  }

  // New helper methods
  updateViewportInfo() {
    this.viewportInfo = {
      width: window.innerWidth,
      height: window.innerHeight,
      deviceScaleFactor: window.devicePixelRatio || 1,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      hasTouch: 'ontouchstart' in window,
      isLandscape: window.innerWidth > window.innerHeight
    };
  }

  recordInitialState() {
    const initialStep = {
      type: 'setViewport',
      width: this.viewportInfo.width,
      height: this.viewportInfo.height,
      deviceScaleFactor: this.viewportInfo.deviceScaleFactor,
      isMobile: this.viewportInfo.isMobile,
      hasTouch: this.viewportInfo.hasTouch,
      isLandscape: this.viewportInfo.isLandscape,
      timestamp: this.recordingStartTime,
      stepNumber: ++this.stepCounter
    };

    this.sendToBackground('record_action', initialStep);
  }

  getRelevantAttributes(element) {
    const attrs = {};
    const relevantAttrs = ['role', 'aria-label', 'aria-labelledby', 'data-testid', 'data-test', 'name', 'type', 'href', 'src', 'alt', 'title', 'placeholder'];

    relevantAttrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value && value.length < 100) {
        attrs[attr] = value;
      }
    });

    return attrs;
  }

  generatePierceSelector(element) {
    // Generate pierce selectors for shadow DOM elements
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      if (current.id) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c => c.trim()).slice(0, 2);
        if (classes.length > 0) {
          path.unshift(`.${classes.map(c => CSS.escape(c)).join('.')}`);
          current = current.parentNode;
          continue;
        }
      }

      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentNode?.children || []);
      const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);

      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        path.unshift(`${tagName}:nth-of-type(${index})`);
      } else {
        path.unshift(tagName);
      }

      current = current.parentNode;
      if (path.length > 5) break; // Limit depth
    }

    return path.length > 0 ? `pierce/${path.join(' > ')}` : null;
  }

  getRecentNetworkActivity() {
    const cutoff = Date.now() - 5000; // Last 5 seconds
    return this.recentNetworkActivity
      .filter(req => req.timestamp > cutoff)
      .slice(-5) // Max 5 recent requests
      .map(req => ({
        url: req.url,
        method: req.method,
        status: req.status,
        type: req.type,
        timestamp: req.timestamp
      }));
  }

  correlateNetworkWithEvent(eventType) {
    // Find network requests that might be related to this event
    const correlatedRequests = [];

    if (eventType === 'click' || eventType === 'submit') {
      // Look for XHR/fetch requests shortly after
      const futureRequests = this.recentNetworkActivity.filter(
        req => req.timestamp > Date.now() - 1000 &&
               (req.type === 'xhr' || req.type === 'fetch')
      );
      correlatedRequests.push(...futureRequests);
    }

    return correlatedRequests;
  }

  exportRecording() {
    // Create Chrome DevTools compatible recording format
    const recording = {
      title: `Recording ${new Date().toLocaleString()}`,
      steps: this.recordedSteps || []
    };

    // Send final recording export
    this.sendToBackground('export_recording', recording);
    console.log('📥 Exported recording with', recording.steps.length, 'steps');
  }

  sendToBackground(type, data) {
    // Store steps for final export
    if (type === 'record_action' && data.type !== 'console') {
      if (!this.recordedSteps) this.recordedSteps = [];
      this.recordedSteps.push(data);
    }

    // Throttle messages to prevent overwhelming the background script
    const now = Date.now();
    if (this.lastMessageTime && now - this.lastMessageTime < 50) { // Max 20 messages/second
      return;
    }
    this.lastMessageTime = now;

    const message = {
      type,
      data,
      timestamp: now,
      sessionId: this.sessionId
    };

    // Limit message size to prevent memory issues
    const messageSize = JSON.stringify(message).length;
    if (messageSize > 50000) { // 50KB limit
      console.warn('🎯 Message too large, skipping:', type, messageSize);
      return;
    }

    console.log('🎯 Sending to background:', type, message);
    try {
      chrome.runtime.sendMessage(message).catch((error) => {
        console.error('Failed to send message to background:', error);
      });
    } catch (error) {
      console.error('Failed to send message to background:', error);
    }
  }
}

// Initialize stealth recorder
const stealthRecorder = new StealthRecorder();