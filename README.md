### Logical Flow for Capturing and Defining E-Commerce Checkout Flow Using Playwright-Extra with Puppeteer-Extra-Plugin-Stealth

This logical flow serves as a comprehensive prompt for a coder agent (e.g., an AI coding assistant or developer) to generate a full application for automating e-commerce checkout processes, such as in a sneaker bot. The app will use **Playwright-Extra** (an extension of Playwright for adding plugins) combined with **Puppeteer-Extra-Plugin-Stealth** (adapted for evasion) to create stealthy, anti-detection browser automation. This ensures the bot mimics human behavior to bypass anti-bot measures like those from Akamai, PerimeterX, or DataDome during checkout.

The flow is divided into two main phases: **Capturing the Flow** (analyzing and recording the site's checkout process) and **Defining the Flow** (implementing it in code as a modular, reusable script). The resulting app should be Node.js-based (since Playwright-Extra is JS-focused), cross-browser compatible (Chromium, Firefox, WebKit), and include features like proxy support, randomization, and error handling. Aim for modularity: one core engine with site-specific modules (e.g., for Nike, Shopify).

#### Prerequisites for the Coder Agent
- **Tech Stack**: Node.js v18+, Playwright v1.40+.
- **Install Dependencies**:
  ```bash
  npm init -y
  npm install playwright playwright-extra puppeteer-extra-plugin-stealth
  ```
- **Setup Playwright-Extra with Stealth**:
  Use this boilerplate to initialize a stealthy browser:
  ```javascript
  const { chromium } = require('playwright-extra');
  const stealth = require('puppeteer-extra-plugin-stealth')(); // Adapt puppeteer-stealth for playwright-extra
  chromium.use(stealth); // Apply stealth plugin to evade detection

  async function launchBrowser() {
    const browser = await chromium.launch({ headless: true }); // Or false for debugging
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // Randomize for stealth
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // Randomize
      // Add proxy: { server: 'http://proxy:port' }
    });
    return { browser, context };
  }
  ```
  - **Why Stealth?**: It applies evasions like randomizing fingerprints (WebGL, canvas, plugins), removing automation traces (e.g., `navigator.webdriver`), and mimicking human inputs to pass bot detection tests. Test evasion using sites like bot.sannysoft.com or creip.me.
- **App Structure**:
  - `/src/core.js`: Core engine for launching browser and handling common tasks (e.g., proxy rotation, CAPTCHA solving).
  - `/src/modules/`: Site-specific flows (e.g., `nike.js`, `shopify.js`).
  - `/config/`: YAML/JSON for flows, proxies, accounts.
  - Include logging (winston), async handling (async/await), and tests (Jest).

#### Phase 1: Capturing the Checkout Flow
Capture the end-to-end (E2E) process manually or semi-automatically to map every step, from product page to order confirmation. This identifies selectors, APIs, and anti-bot hurdles. Use Playwright's built-in tools for efficiency, with stealth enabled to avoid bans during capture.

1. **Preparation**:
   - Launch a stealthy browser instance (using the boilerplate above) in non-headless mode for visibility.
   - Enable tracing: `await context.tracing.start({ screenshots: true, snapshots: true });` to record network, DOM, and actions.
   - Use a proxy and randomized user-agent to mimic real traffic.

2. **Manual Checkout Recording**:
   - Navigate to the product URL (e.g., via `page.goto(url)`).
   - Perform a full human-like checkout: Select variant/size, add to cart, proceed to checkout, login/guest, enter shipping/payment, submit order.
   - Use Playwright Recorder (via VS Code extension or CLI: `npx playwright codegen <url>`) to auto-generate code snippets for actions (e.g., clicks, fills).
   - In DevTools (accessible via `page.evaluate(() => debugger;)`), inspect:
     - **Network Tab**: Capture HTTP requests (e.g., POST to `/cart/add.js`), headers, payloads, cookies, and responses. Export as HAR file for replay.
     - **Elements Tab**: Note selectors (e.g., `#add-to-cart`, `input[name="email"]`). Prefer stable ones (data attributes over classes).
     - **Console Tab**: Log JavaScript variables or anti-bot scripts (e.g., fingerprint generation).
   - Handle Variations: Repeat for edge cases (e.g., sold out, invalid payment, CAPTCHA) to map error flows.

3. **Automated Analysis**:
   - Replay the trace: `npx playwright show-trace trace.zip` to visualize steps, timings, and bottlenecks.
   - Extract APIs: Parse HAR file to identify backend endpoints (e.g., for ATC, checkout). Use tools like `har-extractor` npm package.
   - Detect Anti-Bot: Check for challenges (e.g., reCAPTCHA). Note if stealth plugin successfully bypasses during capture.

4. **Documentation Output**:
   - Generate a YAML/JSON flow map:
     ```yaml
     site: nike
     steps:
       - action: goto
         url: "{product_url}"
       - action: select_variant
         selector: 'select[size]'
         value: "{size}"
       - action: click
         selector: '#add-to-cart'
       - action: fill_form
         fields:
           email: "{email}"
           address: "{shipping}"
       - action: submit_order
         endpoint: "/checkout/submit"  # If API-based
     anti_bot: [captcha, fingerprint]
     ```
   - Include timings (e.g., wait 500ms after click) and randomization points.

#### Phase 2: Defining the Checkout Flow in Code
Translate the captured map into executable code. Make it modular, async, and stealth-optimized. The app should support multiple sites via config, with fallback to browser simulation if APIs fail.

1. **Core Engine Implementation**:
   - Create a `runCheckout` function that loads the site module and executes steps.
   - Integrate Stealth: Ensure every context uses the plugin for evasion (e.g., randomize viewport, geolocation).
   - Add Utilities: Proxy rotation (`context.setExtraHTTPHeaders`), human-like typing (`page.type(selector, text, { delay: 100 })`), mouse movements (`page.mouse.move(x, y)`).

2. **Site-Specific Module**:
   - For each site, define an async function (e.g., `async function nikeCheckout(page, config) { ... }`).
   - Sequential Steps:
     - **Initialization**: `await page.goto(productUrl, { waitUntil: 'networkidle' });` Wait for load.
     - **Variant Selection/ATC**: `await page.select('select[size]', config.size); await page.click('#add-to-cart');`
     - **Cart Verification**: `await page.waitForSelector('.cart-item');` Check contents.
     - **Checkout Navigation**: `await page.goto('/checkout'); await page.fill('input[email]', config.email);`
     - **CAPTCHA Handling**: If detected, integrate a solver like `2captcha` API or manual fallback.
     - **Payment & Submit**: Fill payment, `await page.click('#submit');`
     - **Confirmation**: `await page.waitForSelector('.order-confirmation');` Extract order ID.
   - API Fallback: If site uses REST (e.g., Shopify), switch to `fetch` requests for speed: `await page.evaluate(() => fetch('/cart/add.js', { method: 'POST', body: JSON.stringify(payload) }));`

3. **Evasion and Optimization**:
   - Randomize Actions: Use `Math.random()` for delays (100-500ms), mouse paths.
   - Error Handling: Try-catch for failures (e.g., retry on 429 rate-limit with new proxy).
   - Testing: Write E2E tests with `@playwright/test` to validate the flow (e.g., `test('Nike Checkout', async ({ page }) => { ... });`).

4. **App Integration**:
   - CLI/Dashboard: Use yargs for commands (e.g., `node app.js --site=nike --url=...`).
   - Scalability: Support concurrency with `Promise.all` for multiple tasks.
   - Monitoring: Log successes/failures, integrate notifications (e.g., Discord webhook).

#### Final Output for Coder Agent
Implement the app as a GitHub-ready repo. Test on a demo site like https://www.saucedemo.com (e-commerce playground) before real sites. If stealth fails, iterate with updated plugin evasions.



