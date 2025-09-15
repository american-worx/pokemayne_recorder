/**
 * CommonUtils - Utility functions shared across site modules
 */

/**
 * Generate a human-like delay with randomization
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} variance - Variance as a percentage (0-1)
 * @returns {Promise<void>}
 */
async function humanLikeDelay(baseDelay, variance = 0.3) {
  const minDelay = baseDelay * (1 - variance);
  const maxDelay = baseDelay * (1 + variance);
  const actualDelay = Math.random() * (maxDelay - minDelay) + minDelay;
  
  return new Promise(resolve => setTimeout(resolve, actualDelay));
}

/**
 * Generate a typing delay based on text length
 * @param {string} text - Text to type
 * @param {number} wpm - Words per minute typing speed
 * @param {number} variance - Variance as a percentage (0-1)
 * @returns {Promise<void>}
 */
async function typingDelay(text, wpm = 60, variance = 0.2) {
  // Calculate average characters per word (5 in English)
  const charsPerWord = 5;
  const words = text.length / charsPerWord;
  const baseTime = (words / wpm) * 60 * 1000; // Convert to milliseconds
  
  // Add variance
  const minTime = baseTime * (1 - variance);
  const maxTime = baseTime * (1 + variance);
  const actualTime = Math.random() * (maxTime - minTime) + minTime;
  
  return new Promise(resolve => setTimeout(resolve, actualTime));
}

/**
 * Check if an element is stable (not changing) in the DOM
 * @param {Page} page - Playwright page instance
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} checkInterval - Interval between checks in milliseconds
 * @returns {Promise<boolean>} - Whether element is stable
 */
async function isElementStable(page, selector, timeout = 5000, checkInterval = 100) {
  try {
    // Wait for element to appear
    await page.waitForSelector(selector, { timeout });
    
    // Get initial element properties
    const initialProperties = await page.$eval(selector, el => ({
      text: el.textContent,
      html: el.innerHTML,
      rect: el.getBoundingClientRect()
    }));
    
    // Check periodically if properties remain the same
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      try {
        const currentProperties = await page.$eval(selector, el => ({
          text: el.textContent,
          html: el.innerHTML,
          rect: el.getBoundingClientRect()
        }));
        
        // Compare properties
        if (initialProperties.text !== currentProperties.text ||
            initialProperties.html !== currentProperties.html) {
          // Element changed, reset initial properties
          initialProperties.text = currentProperties.text;
          initialProperties.html = currentProperties.html;
          continue;
        }
        
        // Check if bounding rectangle is stable
        const rectChanged = 
          initialProperties.rect.x !== currentProperties.rect.x ||
          initialProperties.rect.y !== currentProperties.rect.y ||
          initialProperties.rect.width !== currentProperties.rect.width ||
          initialProperties.rect.height !== currentProperties.rect.height;
          
        if (rectChanged) {
          // Element moved, reset initial properties
          initialProperties.rect = currentProperties.rect;
          continue;
        }
        
        // Element appears stable
        return true;
      } catch (error) {
        // Element may have disappeared
        return false;
      }
    }
    
    // Timeout reached
    return false;
  } catch (error) {
    // Element not found or other error
    return false;
  }
}

/**
 * Fill a form field with human-like behavior
 * @param {Page} page - Playwright page instance
 * @param {string} selector - CSS selector for the input field
 * @param {string} value - Value to fill
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
async function humanLikeFill(page, selector, value, options = {}) {
  const {
    typingSpeed = 60, // WPM
    typingVariance = 0.2,
    preDelay = 200,
    postDelay = 100
  } = options;
  
  // Wait for element to be ready
  await page.waitForSelector(selector);
  
  // Pre-delay to simulate human reaction time
  if (preDelay > 0) {
    await humanLikeDelay(preDelay);
  }
  
  // Focus the element
  await page.focus(selector);
  
  // Type with human-like delays
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    await page.type(selector, char, { delay: 0 }); // No built-in delay
    
    // Add human-like typing delay
    const charDelay = (60 / typingSpeed) * 1000 * (0.8 + Math.random() * 0.4);
    await humanLikeDelay(charDelay, typingVariance);
  }
  
  // Post-delay to simulate thinking time
  if (postDelay > 0) {
    await humanLikeDelay(postDelay);
  }
}

/**
 * Click an element with human-like behavior
 * @param {Page} page - Playwright page instance
 * @param {string} selector - CSS selector for the element to click
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
async function humanLikeClick(page, selector, options = {}) {
  const {
    preDelay = 300,
    postDelay = 200,
    moveMouse = true
  } = options;
  
  // Wait for element to be ready
  await page.waitForSelector(selector);
  
  // Pre-delay to simulate human reaction time
  if (preDelay > 0) {
    await humanLikeDelay(preDelay);
  }
  
  if (moveMouse) {
    // Move mouse to element (more human-like)
    const element = await page.$(selector);
    if (element) {
      const box = await element.boundingBox();
      if (box) {
        // Move to a random point within the element
        const x = box.x + Math.random() * box.width;
        const y = box.y + Math.random() * box.height;
        
        // Simulate human-like mouse movement
        await page.mouse.move(x, y, { steps: 5 });
        
        // Small delay after moving
        await humanLikeDelay(50);
      }
    }
  }
  
  // Click the element
  await page.click(selector);
  
  // Post-delay to simulate reaction time
  if (postDelay > 0) {
    await humanLikeDelay(postDelay);
  }
}

/**
 * Wait for a condition with exponential backoff
 * @param {Function} conditionFn - Function that returns a boolean or Promise<boolean>
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>} - Whether condition was met
 */
async function waitForCondition(conditionFn, options = {}) {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    multiplier = 2
  } = options;
  
  let delay = initialDelay;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await conditionFn();
      if (result) {
        return true;
      }
    } catch (error) {
      // If it's the last attempt, throw the error
      if (i === maxRetries) {
        throw error;
      }
    }
    
    // If not the last attempt, wait and then try again
    if (i < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * multiplier, maxDelay);
    }
  }
  
  return false;
}

/**
 * Generate a random user agent string
 * @returns {string} - Random user agent
 */
function getRandomUserAgent() {
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
 * Generate a random viewport size
 * @returns {Object} - Random viewport dimensions
 */
function getRandomViewport() {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 }
  ];
  
  return viewports[Math.floor(Math.random() * viewports.length)];
}

module.exports = {
  humanLikeDelay,
  typingDelay,
  isElementStable,
  humanLikeFill,
  humanLikeClick,
  waitForCondition,
  getRandomUserAgent,
  getRandomViewport
};