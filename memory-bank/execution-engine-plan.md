# Execution Engine Implementation Plan

## Overview

This document outlines the implementation plan for creating an Automation Execution Engine that can consume Chrome DevTools format JSON and replay actions with stealth capabilities.

## Current State Analysis

### Format Comparison

**Chrome DevTools Format** (Target):
```json
{
  "title": "Recording Title",
  "steps": [
    {
      "type": "setViewport|navigate|click|change|keyDown|keyUp",
      "selectors": [["aria/label"], ["#id"], ["xpath//..."], ["pierce/selector"]],
      "target": "main|url",
      "offsetX": 64, "offsetY": 34.1875,
      "assertedEvents": [{"type": "navigation", "url": "...", "title": "..."}],
      "value": "text_input",
      "key": "Control"
    }
  ]
}
```

**Current Recorder Format**:
```json
{
  "session": { "id": "...", "startTime": 123, "url": "...", "userAgent": "..." },
  "actions": [{"type": "click|keystroke", "timestamp": 123, "...clickData"}],
  "network": { "requests": [...], "responses": [...] },
  "security": { "captchas": [...], "redirects": [...], "cookies": [...] },
  "performance": { "navigationTiming": [...], "resourceTiming": [...] },
  "dom": { "mutations": [...], "snapshots": [...] }
}
```

## Implementation Plan

### Phase 1: Enhanced Recorder Output

#### 1.1 Dual Format Support in StealthyRecorder

```javascript
// src/recorder/stealthy-recorder.js - Add method
class StealthyRecorder {
  generateChromeDevToolsFormat() {
    const steps = [
      // Always start with viewport
      {
        type: "setViewport",
        width: this.recordingData.session.viewport.width,
        height: this.recordingData.session.viewport.height,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: false
      }
    ];

    // Convert navigation events
    this.recordingData.security.redirects.forEach(redirect => {
      steps.push({
        type: "navigate",
        url: redirect.url,
        assertedEvents: [{
          type: "navigation",
          url: redirect.url,
          title: redirect.title || ""
        }]
      });
    });

    // Convert actions to steps
    this.recordingData.actions.forEach(action => {
      const step = this.convertActionToStep(action);
      if (step) steps.push(step);
    });

    return {
      title: `Recording ${new Date(this.recordingData.session.startTime).toLocaleString()}`,
      steps: steps,
      metadata: {
        originalFormat: this.recordingData,
        networkRequests: this.recordingData.network.requests.length,
        securityEvents: this.recordingData.security.captchas.length,
        duration: Date.now() - this.recordingData.session.startTime
      }
    };
  }

  convertActionToStep(action) {
    switch (action.type) {
      case 'click':
        return {
          type: "click",
          target: action.target || "main",
          selectors: action.selectors || [[action.selector]],
          offsetX: action.offsetX || 0,
          offsetY: action.offsetY || 0,
          timestamp: action.timestamp
        };

      case 'keystroke':
        if (action.key.length === 1) {
          return {
            type: "change",
            target: action.target || "main",
            selectors: action.selectors || [[action.selector]],
            value: action.value || action.key
          };
        } else {
          return [
            {
              type: "keyDown",
              target: action.target || "main",
              key: action.key
            },
            {
              type: "keyUp",
              target: action.target || "main",
              key: action.key
            }
          ];
        }

      case 'navigation':
        return {
          type: "navigate",
          url: action.url,
          assertedEvents: [{
            type: "navigation",
            url: action.url,
            title: action.title || ""
          }]
        };

      default:
        return null;
    }
  }

  async saveRecording(outputPath) {
    // Save original comprehensive format
    const recordingPath = path.join(outputPath, 'recording.json');
    await fs.writeJson(recordingPath, this.recordingData, { spaces: 2 });

    // Save Chrome DevTools compatible format
    const chromeFormat = this.generateChromeDevToolsFormat();
    const chromePath = path.join(outputPath, 'chrome-devtools-recording.json');
    await fs.writeJson(chromePath, chromeFormat, { spaces: 2 });

    return { recordingPath, chromePath };
  }
}
```

#### 1.2 Enhanced Content Script for Better Selectors

```javascript
// browser-extension/content.js - Enhance generateAdvancedSelectors
generateAdvancedSelectors(element) {
  const selectors = [];

  // ARIA selector (highest priority)
  const ariaLabel = element.getAttribute('aria-label') ||
                   element.getAttribute('aria-labelledby') ||
                   element.textContent?.trim();
  if (ariaLabel) {
    selectors.push([`aria/${ariaLabel}`]);
  }

  // Data-test attributes (high priority for automation)
  const dataTest = element.getAttribute('data-test') ||
                  element.getAttribute('data-testid');
  if (dataTest) {
    selectors.push([`[data-test='${dataTest}']`]);
  }

  // XPath selector
  const xpath = this.generateXPath(element);
  selectors.push([`xpath//${xpath}`]);

  // Pierce selector (shadow DOM support)
  const cssSelector = this.generateCSSSelector(element);
  selectors.push([`pierce/${cssSelector}`]);

  // Text-based selector
  const textContent = element.textContent?.trim();
  if (textContent && textContent.length < 50) {
    selectors.push([`text/${textContent}`]);
  }

  // Regular CSS selector (fallback)
  selectors.push([[cssSelector]]);

  return selectors;
}

generateXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();

    if (element.id) {
      selector += `[@id="${element.id}"]`;
      path.unshift(selector);
      break;
    } else if (element.className) {
      selector += `[@class="${element.className}"]`;
    }

    // Add position if no unique attributes
    const siblings = Array.from(element.parentNode?.children || [])
      .filter(sibling => sibling.nodeName === element.nodeName);

    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      selector += `[${index}]`;
    }

    path.unshift(selector);
    element = element.parentNode;
  }

  return path.join('/');
}
```

### Phase 2: Execution Engine Core

#### 2.1 AutomationExecutionEngine Class

```javascript
// src/automation/execution-engine.js
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import logger from '../core/utils/logger.js';

class AutomationExecutionEngine {
  constructor(options = {}) {
    this.options = {
      headless: options.headless ?? false,
      stealth: options.stealth ?? true,
      screenshots: options.screenshots ?? true,
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 3,
      ...options
    };

    this.browser = null;
    this.context = null;
    this.page = null;
    this.executionResults = {
      steps: [],
      screenshots: [],
      errors: [],
      startTime: null,
      endTime: null,
      success: false
    };
  }

  async executeFlow(flowConfig, userProfile = {}) {
    this.executionResults.startTime = Date.now();

    try {
      logger.info('Starting flow execution', {
        title: flowConfig.title,
        steps: flowConfig.steps.length
      });

      // Setup stealth browser
      await this.setupBrowser();

      // Execute each step
      for (let i = 0; i < flowConfig.steps.length; i++) {
        const step = flowConfig.steps[i];

        logger.info(`Executing step ${i + 1}/${flowConfig.steps.length}`, {
          type: step.type,
          target: step.target
        });

        const stepResult = await this.executeStep(step, i);
        this.executionResults.steps.push(stepResult);

        if (!stepResult.success && !step.optional) {
          throw new Error(`Step ${i + 1} failed: ${stepResult.error}`);
        }

        // Human-like delay between steps
        await this.humanDelay();
      }

      this.executionResults.success = true;
      logger.info('Flow execution completed successfully');

    } catch (error) {
      this.executionResults.success = false;
      this.executionResults.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
      logger.error('Flow execution failed', error);
      throw error;

    } finally {
      this.executionResults.endTime = Date.now();
      await this.cleanup();
    }

    return this.executionResults;
  }

  async setupBrowser() {
    // Apply stealth plugin
    if (this.options.stealth) {
      chromium.use(stealth());
    }

    this.browser = await chromium.launch({
      headless: this.options.headless,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    this.page = await this.context.newPage();

    // Enable request/response tracking
    await this.setupNetworkTracking();
  }

  async executeStep(step, stepIndex) {
    const result = {
      stepIndex,
      type: step.type,
      timestamp: Date.now(),
      success: false,
      error: null,
      duration: 0,
      screenshot: null
    };

    const startTime = Date.now();

    try {
      switch (step.type) {
        case 'setViewport':
          await this.setViewport(step);
          break;

        case 'navigate':
          await this.navigate(step);
          break;

        case 'click':
          await this.click(step);
          break;

        case 'change':
          await this.change(step);
          break;

        case 'keyDown':
          await this.keyDown(step);
          break;

        case 'keyUp':
          await this.keyUp(step);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Verify assertions if present
      if (step.assertedEvents) {
        await this.verifyAssertions(step.assertedEvents);
      }

      result.success = true;

    } catch (error) {
      result.error = error.message;

      // Retry logic for failed steps
      if (this.options.retries > 0) {
        logger.warn(`Step failed, retrying... (${this.options.retries} attempts left)`);
        this.options.retries--;
        return await this.executeStep(step, stepIndex);
      }

    } finally {
      result.duration = Date.now() - startTime;

      // Take screenshot if enabled
      if (this.options.screenshots) {
        result.screenshot = await this.takeScreenshot(stepIndex);
      }
    }

    return result;
  }
}
```

#### 2.2 Step Implementation Methods

```javascript
// src/automation/execution-engine.js - Step methods
class AutomationExecutionEngine {
  async setViewport(step) {
    await this.page.setViewportSize({
      width: step.width,
      height: step.height
    });

    logger.info('Viewport set', {
      width: step.width,
      height: step.height
    });
  }

  async navigate(step) {
    const response = await this.page.goto(step.url, {
      waitUntil: 'domcontentloaded',
      timeout: this.options.timeout
    });

    if (!response.ok()) {
      throw new Error(`Navigation failed: ${response.status()} ${response.statusText()}`);
    }

    // Wait for page to stabilize
    await this.page.waitForLoadState('networkidle');

    logger.info('Navigation completed', {
      url: step.url,
      status: response.status()
    });
  }

  async click(step) {
    const element = await this.findElementWithFallback(step.selectors);

    // Scroll element into view
    await element.scrollIntoViewIfNeeded();

    // Human-like click with offset
    const box = await element.boundingBox();
    const clickX = (step.offsetX || 0) + (box.width / 2);
    const clickY = (step.offsetY || 0) + (box.height / 2);

    await element.click({
      position: { x: clickX, y: clickY },
      force: false
    });

    logger.info('Click executed', {
      selector: step.selectors[0][0],
      position: { x: clickX, y: clickY }
    });
  }

  async change(step) {
    const element = await this.findElementWithFallback(step.selectors);

    // Clear existing value
    await element.clear();

    // Type new value with human-like typing
    await element.type(step.value, {
      delay: Math.random() * 100 + 50
    });

    logger.info('Value changed', {
      selector: step.selectors[0][0],
      value: step.value.substring(0, 20) + (step.value.length > 20 ? '...' : '')
    });
  }

  async keyDown(step) {
    await this.page.keyboard.down(step.key);
    logger.info('Key down', { key: step.key });
  }

  async keyUp(step) {
    await this.page.keyboard.up(step.key);
    logger.info('Key up', { key: step.key });
  }

  async findElementWithFallback(selectors, timeout = 5000) {
    const errors = [];

    for (const selectorGroup of selectors) {
      for (const selector of selectorGroup) {
        try {
          let locator;

          if (selector.startsWith('aria/')) {
            const ariaLabel = selector.slice(5);
            locator = this.page.getByRole('button', { name: ariaLabel })
              .or(this.page.getByRole('link', { name: ariaLabel }))
              .or(this.page.getByLabel(ariaLabel));
          } else if (selector.startsWith('xpath//')) {
            locator = this.page.locator(`xpath=${selector.slice(7)}`);
          } else if (selector.startsWith('pierce/')) {
            locator = this.page.locator(selector.slice(7));
          } else if (selector.startsWith('text/')) {
            const text = selector.slice(5);
            locator = this.page.getByText(text, { exact: false });
          } else {
            locator = this.page.locator(selector);
          }

          // Wait for element to be visible and actionable
          await locator.waitFor({
            state: 'visible',
            timeout: timeout / selectors.length
          });

          return locator.first();

        } catch (error) {
          errors.push(`${selector}: ${error.message}`);
          continue;
        }
      }
    }

    throw new Error(`No working selector found. Tried:\n${errors.join('\n')}`);
  }

  async verifyAssertions(assertedEvents) {
    for (const assertion of assertedEvents) {
      switch (assertion.type) {
        case 'navigation':
          const currentUrl = this.page.url();
          if (!currentUrl.includes(assertion.url)) {
            throw new Error(`Navigation assertion failed. Expected: ${assertion.url}, Got: ${currentUrl}`);
          }

          if (assertion.title) {
            const title = await this.page.title();
            if (!title.includes(assertion.title)) {
              throw new Error(`Title assertion failed. Expected: ${assertion.title}, Got: ${title}`);
            }
          }
          break;

        default:
          logger.warn('Unknown assertion type', { type: assertion.type });
      }
    }
  }

  async humanDelay() {
    // Random delay between 500ms and 2000ms
    const delay = Math.random() * 1500 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async takeScreenshot(stepIndex) {
    try {
      const screenshotPath = `screenshot-step-${stepIndex}.png`;
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      return screenshotPath;
    } catch (error) {
      logger.error('Screenshot failed', error);
      return null;
    }
  }

  async setupNetworkTracking() {
    this.page.on('request', request => {
      logger.debug('Request', {
        url: request.url(),
        method: request.method()
      });
    });

    this.page.on('response', response => {
      logger.debug('Response', {
        url: response.url(),
        status: response.status()
      });
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export default AutomationExecutionEngine;
```

### Phase 3: Integration with Existing System

#### 3.1 Update Database Routes

```javascript
// src/api/database-routes.js - Enhanced execute endpoint
router.post('/flows/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { config = {}, userProfile = {} } = req.body;

    const flow = await req.repository.loadFlow(id);
    if (!flow) {
      return res.status(404).json({
        error: 'Flow not found',
        id
      });
    }

    // Load Chrome DevTools format from flow steps
    const flowConfig = {
      title: flow.name,
      steps: flow.steps
    };

    const executionEngine = new AutomationExecutionEngine({
      headless: config.headless ?? true,
      stealth: config.stealth ?? true,
      screenshots: config.screenshots ?? true,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3
    });

    // Execute flow
    const result = await executionEngine.executeFlow(flowConfig, userProfile);

    // Update flow performance metrics
    flow.recordExecution(
      result.success,
      result.endTime - result.startTime,
      result.errors[0]?.message
    );

    await req.repository.saveFlow(flow);

    res.json({
      success: true,
      executionId: `exec_${Date.now()}`,
      flow: flow.id,
      status: result.success ? 'completed' : 'failed',
      duration: result.endTime - result.startTime,
      steps: result.steps.length,
      screenshots: result.screenshots.length,
      errors: result.errors
    });

  } catch (error) {
    logger.error(`Failed to execute flow ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to execute flow',
      message: error.message
    });
  }
});
```

#### 3.2 Update Server Routes

```javascript
// src/api/server.js - Update automation run endpoint
this.app.post('/api/automation/run/:automationId', async (req, res) => {
  try {
    const { automationId } = req.params;
    const automation = this.activeAutomations.get(automationId);

    if (!automation) {
      return res.status(404).json({
        error: 'Automation not found',
        automationId
      });
    }

    // Convert automation config to Chrome DevTools format
    const flowConfig = this.convertAutomationToFlow(automation);

    const executionEngine = new AutomationExecutionEngine({
      headless: false, // Show browser for debugging
      stealth: true,
      screenshots: true
    });

    // Start execution in background
    const executionPromise = executionEngine.executeFlow(flowConfig, automation.customer);

    // Store execution promise
    this.activeAutomations.set(automationId, {
      ...automation,
      executionPromise,
      status: 'running',
      startTime: Date.now()
    });

    // Emit real-time updates
    executionPromise
      .then(result => {
        this.io.emit('automation_completed', {
          automationId,
          success: true,
          duration: result.endTime - result.startTime,
          steps: result.steps.length,
          orderNumber: `AUTO${Date.now().toString().slice(-8)}`
        });
      })
      .catch(error => {
        this.io.emit('automation_failed', {
          automationId,
          error: error.message
        });
      });

    res.json({
      success: true,
      message: 'Automation started',
      automationId,
      status: 'running'
    });

  } catch (error) {
    logger.error('Failed to run automation:', error);
    res.status(500).json({
      error: 'Failed to start automation',
      message: error.message
    });
  }
});

convertAutomationToFlow(automation) {
  // Convert automation config to Chrome DevTools format
  // This would need to be implemented based on your automation structure
  return {
    title: automation.name,
    steps: [
      {
        type: "setViewport",
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: false
      },
      {
        type: "navigate",
        url: automation.productUrl,
        assertedEvents: [{
          type: "navigation",
          url: automation.productUrl,
          title: ""
        }]
      }
      // Add more steps based on automation.site (walmart, target, etc.)
    ]
  };
}
```

## Pseudocode Summary

```pseudocode
FUNCTION executeAutomationFlow(flowConfig, options):
  INITIALIZE execution_results

  TRY:
    // Phase 1: Setup
    browser = setupStealthBrowser(options)
    page = browser.newPage()

    // Phase 2: Execute steps
    FOR EACH step IN flowConfig.steps:
      result = EXECUTE_STEP(step, page)
      execution_results.steps.APPEND(result)

      IF result.failed AND NOT step.optional:
        THROW error

      WAIT humanDelay()
    END FOR

    // Phase 3: Verification
    IF flowConfig.assertedEvents:
      VERIFY_ASSERTIONS(flowConfig.assertedEvents, page)

    execution_results.success = TRUE

  CATCH error:
    execution_results.success = FALSE
    execution_results.errors.APPEND(error)

  FINALLY:
    CLEANUP browser

  RETURN execution_results

FUNCTION EXECUTE_STEP(step, page):
  SWITCH step.type:
    CASE 'navigate':
      page.goto(step.url)
      WAIT_FOR_LOAD()

    CASE 'click':
      element = FIND_ELEMENT_WITH_FALLBACK(step.selectors, page)
      element.scrollIntoView()
      element.click(step.offsetX, step.offsetY)

    CASE 'change':
      element = FIND_ELEMENT_WITH_FALLBACK(step.selectors, page)
      element.clear()
      element.type(step.value)

    CASE 'keyDown'/'keyUp':
      page.keyboard.press(step.key)

  IF step.assertedEvents:
    VERIFY_ASSERTIONS(step.assertedEvents, page)

  RETURN step_result

FUNCTION FIND_ELEMENT_WITH_FALLBACK(selectors, page):
  FOR EACH selector_group IN selectors:
    FOR EACH selector IN selector_group:
      TRY:
        IF selector.startsWith('aria/'):
          element = page.getByRole(selector)
        ELIF selector.startsWith('xpath//'):
          element = page.locator('xpath=' + selector)
        ELIF selector.startsWith('pierce/'):
          element = page.locator(selector)
        ELSE:
          element = page.locator(selector)

        WAIT_FOR element.visible()
        RETURN element

      CATCH selector_error:
        CONTINUE

  THROW 'No working selector found'
```

## Implementation Timeline

1. **Week 1**: Enhance StealthyRecorder to output Chrome DevTools format
2. **Week 2**: Build AutomationExecutionEngine core with step handlers
3. **Week 3**: Integrate with database routes and API endpoints
4. **Week 4**: Testing, debugging, and UI integration
5. **Week 5**: Production deployment and monitoring

## Success Metrics

- **Format Compatibility**: 100% of recorder actions convert to Chrome DevTools format
- **Execution Success Rate**: >90% step success rate for standard e-commerce flows
- **Performance**: <30s average execution time for typical checkout flows
- **Reliability**: <5% failure rate due to selector issues
- **Network Tracking**: Complete request/response capture during execution

This plan provides a comprehensive roadmap for implementing a robust automation execution engine that can consume Chrome DevTools format JSON while maintaining stealth capabilities and comprehensive logging.