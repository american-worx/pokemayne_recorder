# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an e-commerce automation project using Playwright-Extra with stealth capabilities for automated checkout processes. The project uses Node.js and focuses on creating modular, reusable automation scripts for various e-commerce platforms.

## Architecture

The project follows a modular architecture:
- **Core Engine** (`/src/core.js`) - Main browser automation and common tasks
- **Site Modules** (`/src/modules/`) - Site-specific automation flows (Nike, Shopify, etc.)
- **Configuration** (`/config/`) - YAML/JSON configuration files for flows, proxies, accounts
- **Memory Bank** (`/memory-bank/`) - Comprehensive documentation using Cline's memory system

## Key Technologies

- **Playwright-Extra**: Browser automation framework with plugin support
- **Puppeteer-Extra-Plugin-Stealth**: Anti-detection evasion capabilities
- **Node.js v18+**: Runtime environment
- **Chromium/Firefox/WebKit**: Cross-browser support

## Common Commands

```bash
# Install dependencies
npm init -y
npm install playwright playwright-extra puppeteer-extra-plugin-stealth

# Setup Playwright browsers
npx playwright install

# Run automation (example)
node app.js --site=nike --url=<product_url>

# Generate code from recording
npx playwright codegen <url>
```

## Development Setup

### Basic Stealth Configuration
```javascript
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...'
});
```

### Flow Capture Process
1. Launch stealth browser with tracing enabled
2. Record manual checkout process using Playwright Recorder
3. Analyze network requests and extract API endpoints
4. Document selectors and timing requirements
5. Create site-specific module

## Memory Bank System

The project uses Cline's Memory Bank for documentation:
- Read ALL memory bank files at start of each session
- Core files: `projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`
- Site-specific documentation in `/memory-bank/sites/`

## Testing and Validation

- Test evasion capabilities on detection sites (bot.sannysoft.com)
- Validate automation on demo sites before production use
- Use Jest for E2E testing: `@playwright/test`

## Important Notes

- Always use proper delays and human-like interactions
- Implement proxy rotation for scale
- Handle CAPTCHAs with appropriate solvers
- Respect rate limits and website terms of service
- Log all activities for debugging and optimization

## Development Guidelines

- Prefer stable selectors (data attributes over CSS classes)
- Implement retry mechanisms with exponential backoff
- Use async/await for all operations
- Maintain comprehensive error handling
- Document all site-specific quirks and timing requirements