# Tech Context: Pokemayne Recorder

## Technology Stack

### Core Runtime
- **Node.js v18+**: JavaScript runtime with modern ES6+ features and async/await support
- **npm/yarn**: Package management for dependencies and scripts

### Browser Automation
- **Playwright v1.40+**: Cross-browser automation framework with excellent API
- **Playwright-Extra**: Extension framework for adding plugins to Playwright
- **Puppeteer-Extra-Plugin-Stealth**: Anti-detection plugin adapted for Playwright

### Development Tools
- **TypeScript (Optional)**: Type safety for complex automation logic
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Code formatting for consistent style
- **Jest**: Testing framework for unit and integration tests

## Development Setup

### Environment Requirements
```bash
# Minimum Requirements
Node.js >= 18.0.0
npm >= 8.0.0 || yarn >= 1.22.0
Git >= 2.30.0

# Recommended
Node.js >= 20.0.0 (LTS)
npm >= 9.0.0
```

### Installation Process
```bash
# Clone repository
git clone <repository-url>
cd pokemayne-recorder

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Setup development environment
npm run setup
```

### Development Scripts
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:e2e": "playwright test",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write src/**/*.js",
    "build": "npm run lint && npm run test"
  }
}
```

## Technical Constraints

### Browser Compatibility
- **Primary**: Chromium (most compatible with stealth plugins)
- **Secondary**: Firefox, WebKit (limited stealth plugin support)
- **Constraints**: Stealth effectiveness varies by browser engine

### Platform Support
- **OS**: Linux, macOS, Windows
- **Architecture**: x64, ARM64
- **Constraints**: Browser binaries must match host architecture

### Network Constraints
- **Proxy Support**: HTTP/HTTPS/SOCKS5 proxies required for IP rotation
- **Bandwidth**: High bandwidth recommended for concurrent executions
- **Latency**: Low-latency connections preferred for real-time interactions

### Resource Constraints
- **Memory**: Minimum 4GB RAM, recommended 8GB+ for concurrent sessions
- **Storage**: 2GB+ for browser binaries and cache
- **CPU**: Multi-core processor recommended for parallel execution

## Dependencies

### Core Dependencies
```json
{
  "playwright": "^1.40.0",
  "playwright-extra": "^4.3.0",
  "puppeteer-extra-plugin-stealth": "^2.11.2"
}
```

### Utility Dependencies
```json
{
  "winston": "^3.8.0",           // Logging framework
  "yargs": "^17.7.0",            // CLI argument parsing
  "js-yaml": "^4.1.0",           // YAML configuration support
  "axios": "^1.4.0",             // HTTP client for API calls
  "cheerio": "^1.0.0-rc.12",     // HTML parsing and manipulation
  "uuid": "^9.0.0",              // Unique identifier generation
  "dotenv": "^16.0.0"            // Environment variable management
}
```

### Development Dependencies
```json
{
  "@playwright/test": "^1.40.0",  // E2E testing framework
  "jest": "^29.0.0",             // Unit testing framework
  "eslint": "^8.0.0",            // Code linting
  "prettier": "^3.0.0",          // Code formatting
  "nodemon": "^3.0.0"            // Development file watching
}
```

## Tool Usage Patterns

### Playwright Integration
```javascript
// Standard usage pattern
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Apply stealth plugin
chromium.use(stealth);

// Launch with custom options
const browser = await chromium.launch({
  headless: false, // Debug mode
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

### Stealth Plugin Configuration
```javascript
// Advanced stealth configuration
chromium.use(stealth({
  // Disable specific evasions if needed
  enabledEvasions: new Set([
    'chrome.app',
    'chrome.csi',
    'chrome.loadTimes',
    'chrome.runtime',
    'iframe.contentWindow',
    'media.codecs',
    'navigator.hardwareConcurrency',
    'navigator.languages',
    'navigator.permissions',
    'navigator.plugins',
    'navigator.vendor',
    'navigator.webdriver',
    'webgl.vendor',
    'window.outerdimensions'
  ])
}));
```

### Configuration Management
```javascript
// YAML configuration loading
const yaml = require('js-yaml');
const fs = require('fs');

const config = yaml.load(fs.readFileSync('./config/flow.yml', 'utf8'));

// Environment variable override
require('dotenv').config();
const apiKey = process.env.CAPTCHA_API_KEY;
```

### Logging Setup
```javascript
// Winston logger configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

## Development Workflow

### Local Development
1. **Code Changes**: Modify source files in `src/` directory
2. **Testing**: Run unit tests with `npm test`
3. **Linting**: Check code quality with `npm run lint`
4. **Formatting**: Auto-format code with `npm run format`

### Testing Strategy
1. **Unit Tests**: Test individual functions and modules
2. **Integration Tests**: Test module interactions
3. **E2E Tests**: Full checkout flow validation
4. **Performance Tests**: Measure execution speed and resource usage

### Deployment Process
1. **Build**: Run linting and tests
2. **Package**: Create distributable package
3. **Documentation**: Update README and memory bank
4. **Release**: Tag version and publish

## Performance Considerations

### Browser Optimization
- **Headless Mode**: Use for production, headed for debugging
- **Browser Context Reuse**: Share contexts when possible
- **Resource Cleanup**: Explicitly close browsers and contexts

### Memory Management
- **Garbage Collection**: Monitor memory usage in long-running processes
- **Object Pooling**: Reuse expensive objects (database connections, etc.)
- **Streaming**: Process large datasets without loading entirely in memory

### Network Optimization
- **Connection Pooling**: Reuse HTTP connections
- **Request Batching**: Combine multiple requests when possible
- **Caching**: Cache static resources and API responses

## Security Considerations

### Credential Management
- **Environment Variables**: Store sensitive data in .env files
- **Encryption**: Encrypt stored credentials at rest
- **Access Control**: Limit file permissions for sensitive files

### Network Security
- **HTTPS Only**: Use secure connections for all external requests
- **Certificate Validation**: Verify SSL certificates
- **Proxy Security**: Use authenticated proxies when available

### Code Security
- **Input Validation**: Validate all user inputs and configurations
- **Dependency Scanning**: Regular security audits of dependencies
- **Code Review**: Peer review for security-sensitive changes
