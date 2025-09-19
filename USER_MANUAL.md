# Pokemayne Recorder - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Getting Started](#getting-started)
5. [CLI Usage](#cli-usage)
6. [Web Interface](#web-interface)
7. [Recording Sessions](#recording-sessions)
8. [Inventory Monitoring](#inventory-monitoring)
9. [Automation](#automation)
10. [Advanced Configuration](#advanced-configuration)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## Introduction

Pokemayne Recorder is an advanced e-commerce automation system designed for legitimate purchasing automation. It provides:

- **Stealthy Recording**: Capture user interactions with anti-detection capabilities
- **Inventory Monitoring**: Real-time stock tracking with instant notifications
- **Automation Engine**: Replay recorded sessions with human-like behavior
- **Web Interface**: Modern dashboard for managing all operations
- **Multi-Site Support**: Optimized modules for different e-commerce platforms

### Key Features
- Ultra-advanced stealth browser automation
- Real-time inventory monitoring with Discord notifications
- Comprehensive session recording and replay
- Modern React-based web dashboard
- CLI interface for power users
- Modular architecture for easy expansion

---

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- Git
- Chrome/Chromium browser (for Playwright)

### Quick Install
```bash
# Clone the repository
git clone <repository-url>
cd pokemayne_recorder

# Install dependencies and setup
npm run setup

# This will:
# - Install main dependencies
# - Install UI dependencies
# - Download Playwright browsers
# - Create necessary directories
```

### Manual Installation
```bash
# Install main dependencies
npm install

# Install UI dependencies
cd ui && npm install --legacy-peer-deps
cd ..

# Install Playwright browsers
npx playwright install

# Create required directories
mkdir -p logs recordings configs monitor-data
```

---

## Configuration

### Environment Setup
Create a `.env` file in the root directory:

```env
# API Configuration
PORT=3001
LOG_LEVEL=info

# Discord Notifications (Optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url

# 2captcha API (Optional)
CAPTCHA_API_KEY=your-2captcha-api-key

# Proxy Configuration (Optional)
PROXY_ENABLED=false
PROXY_LIST=proxy1:port:user:pass,proxy2:port:user:pass
```

### Basic Configuration Files

#### configs/default.yaml
```yaml
general:
  stealthLevel: "ultra"
  headless: false
  timeout: 60000
  maxRetries: 3
  humanBehavior: true

browser:
  userAgent: "auto"
  viewport: "auto"
  proxy: null

notifications:
  discord:
    enabled: false
    webhook: ""
  desktop:
    enabled: true

sites:
  walmart:
    selectors:
      addToCart: "[data-automation-id='add-to-cart-button']"
      cart: "[data-automation-id='cart-icon']"
      checkout: "[data-automation-id='checkout-button']"
```

---

## Getting Started

### 1. Start the System
```bash
# Start the full system (API + Web Interface)
npm run start:full

# OR start components separately:
npm run api        # Start API server only
npm run ui         # Start web interface only
npm run dev:full   # Development mode with hot reload

# Stop individual services
  npm run stop:api
  npm run stop:ui
  npm run stop:monitor

  # Stop everything at once
  npm run stop:full

  # Then restart what you need
  npm run api
  npm run dev:full
```


### 2. Access the Web Interface
Open your browser to `http://localhost:3001`

### 3. First-Time Setup
1. Navigate to Settings in the web interface
2. Configure your Discord webhook (optional)
3. Set up proxy settings (if needed)
4. Adjust stealth and behavior settings

---

## CLI Usage

The CLI provides direct access to all functionality:

### Recording Sessions
```bash
# Start recording a website
node src/index.js record https://www.walmart.com/ip/pokemon-cards/123

# With custom options
node src/index.js record https://www.walmart.com/ip/pokemon-cards/123 \
  --session my-session \
  --output recordings \
  --headless false
```

### Inventory Monitoring
```bash
# Start monitoring mode
node src/index.js monitor

# This will prompt you to add products to monitor
```

### Automation
```bash
# Run automation from config file
node src/index.js run configs/walmart-pokemon.yaml

# Quick Pokemon/Walmart setup
node src/index.js pokemon-walmart
```

### Configuration Management
```bash
# Create new configuration
node src/index.js create-config
```

---

## Web Interface

### Dashboard
The main dashboard provides:
- **Live Statistics**: Active recordings, monitors, success rates
- **Real-time Charts**: Performance metrics and trends
- **Quick Actions**: Start recording, add monitors, run automations
- **System Status**: API health, active processes

### Recording Studio
- **Start New Recording**: Input URL and configure options
- **Session Management**: View, replay, and analyze recordings
- **Live Preview**: Watch recordings in real-time
- **Export Options**: Download session data and traces

### Stock Monitor
- **Add Products**: Input URLs for monitoring
- **Live Status**: Real-time stock availability
- **Alert History**: View past notifications
- **Bulk Operations**: Add multiple products at once

### Automation Panel
- **Configuration Wizard**: Step-by-step automation setup
- **Execution Control**: Start, stop, and monitor automations
- **Performance Metrics**: Success rates and execution times
- **Log Viewer**: Detailed execution logs

---

## Recording Sessions

### Starting a Recording
1. **Web Interface**:
   - Go to Recording Studio
   - Enter the target URL
   - Configure options (headless, session name, etc.)
   - Click "Start Recording"

2. **CLI**:
   ```bash
   node src/index.js record <URL> [options]
   ```

### What Gets Recorded
- **User Interactions**: Clicks, typing, scrolling, form submissions
- **Network Requests**: API calls, resource loading, responses
- **Page Events**: Navigation, popups, alerts
- **Performance Data**: Load times, resource usage
- **Security Challenges**: CAPTCHAs, anti-bot measures

### Recording Output
Each session creates:
- `session_data.json`: Complete interaction log
- `trace.zip`: Playwright trace file
- `screenshots/`: Page screenshots at key moments
- `network_log.json`: Network request/response data
- `performance.json`: Performance metrics

### Analyzing Recordings
```bash
# View session summary
cat recordings/session_123/session_data.json | jq '.summary'

# Open Playwright trace in browser
npx playwright show-trace recordings/session_123/trace.zip
```

---

## Inventory Monitoring

### Adding Products to Monitor

#### Web Interface
1. Go to Stock Monitor
2. Click "Add Product"
3. Enter product URL
4. Configure check interval (default: 30 seconds)
5. Set notification preferences

#### CLI
```bash
node src/index.js monitor
# Follow prompts to add products
```

#### Programmatically
```javascript
import InventoryMonitor from './src/monitor/inventory-monitor.js';

const monitor = new InventoryMonitor({
  checkInterval: '*/30 * * * * *', // Every 30 seconds
  notifications: ['discord', 'desktop']
});

await monitor.addProduct({
  name: 'Pokemon Battle Academy',
  url: 'https://www.walmart.com/ip/pokemon-battle-academy/573850405',
  site: 'walmart',
  targetPrice: 20.00
});

await monitor.startMonitoring();
```

### Monitoring Features
- **Multi-Strategy Detection**: API calls + DOM analysis
- **Price Tracking**: Monitor price changes
- **Stock Alerts**: Instant notifications when items come in stock
- **Historical Data**: Track availability patterns
- **Site-Specific Optimizations**: Tailored for each platform

### Notification Types
- **Discord Webhooks**: Rich embeds with product details
- **Desktop Notifications**: System notifications
- **Console Alerts**: Real-time CLI output
- **Web Dashboard**: Live updates in browser

---

## Automation

### Creating Automation Configs

#### Using the Web Interface
1. Go to Automation Panel
2. Click "Create New Automation"
3. Follow the step-by-step wizard:
   - Select site (Walmart, Target, etc.)
   - Enter product URL
   - Configure checkout settings
   - Set up payment information
   - Review and save

#### Manual Configuration
Create a YAML file in the `configs/` directory:

```yaml
# configs/pokemon-walmart.yaml
name: "Pokemon Walmart Auto"
site: "walmart"
url: "https://www.walmart.com/ip/pokemon-cards/123456"

options:
  headless: false
  stealthLevel: "ultra"
  humanBehavior: true
  maxRetries: 3
  timeout: 60000

checkout:
  email: "your-email@example.com"
  shipping:
    firstName: "John"
    lastName: "Doe"
    address: "123 Main St"
    city: "Anytown"
    state: "CA"
    zipCode: "12345"

  payment:
    type: "credit"
    # Payment details handled securely during execution

behavior:
  mouseSpeed: "human"
  typingSpeed: "natural"
  waitTimes:
    min: 1000
    max: 3000

notifications:
  discord: true
  desktop: true
```

### Running Automations

#### Web Interface
1. Go to Automation Panel
2. Select your configuration
3. Click "Run Automation"
4. Monitor progress in real-time

#### CLI
```bash
# Run specific configuration
node src/index.js run configs/pokemon-walmart.yaml

# Quick Walmart Pokemon setup
node src/index.js pokemon-walmart
```

### Automation Features
- **Human-like Behavior**: Random delays, mouse movements, typing patterns
- **CAPTCHA Handling**: Integration with 2captcha service + manual fallback
- **Error Recovery**: Automatic retries with exponential backoff
- **Multi-selector Fallback**: Robust element finding
- **Session Management**: Maintain login state across runs

---

## Advanced Configuration

### Stealth Settings
```yaml
stealth:
  level: "ultra"  # basic, advanced, ultra
  evasions:
    - "navigator.webdriver"
    - "chrome.runtime"
    - "window.outerdimensions"
    - "webgl.vendor"
    - "user.agent.override"

  fingerprinting:
    randomizeViewport: true
    randomizeUserAgent: true
    spoofTimezone: false
    spoofLanguages: true
```

### Proxy Configuration
```yaml
proxies:
  enabled: true
  rotation: true
  type: "residential"  # residential, datacenter
  providers:
    - type: "custom"
      endpoints:
        - "proxy1.example.com:8080:user:pass"
        - "proxy2.example.com:8080:user:pass"
```

### Site-Specific Settings
```yaml
sites:
  walmart:
    optimizations:
      userAgent: "walmart-optimized"
      viewport: "1920x1080"
      cookies: "accept-all"

    selectors:
      addToCart:
        primary: "[data-automation-id='add-to-cart-button']"
        fallback: ["button[aria-label*='Add to cart']", ".add-to-cart"]

      captcha:
        container: ".captcha-container"
        iframe: "iframe[src*='captcha']"

    timing:
      pageLoad: 10000
      elementWait: 5000
      actionDelay: 2000
```

### Performance Tuning
```yaml
performance:
  browser:
    maxInstances: 3
    reuseContext: true
    cacheSize: "100mb"

  monitoring:
    batchSize: 10
    parallelChecks: 5
    cacheTimeout: 300000

  automation:
    queueSize: 50
    retryBackoff: "exponential"
    memoryLimit: "512mb"
```

---

## Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Ensure all dependencies are installed
npm install
cd ui && npm install --legacy-peer-deps
```

#### Browser automation fails
```bash
# Reinstall Playwright browsers
npx playwright install
```

#### Permission errors on Linux/Mac
```bash
# Fix permissions
chmod +x src/index.js
sudo chown -R $(whoami) logs recordings configs
```

#### CAPTCHA detection too frequent
1. Adjust stealth level to "ultra"
2. Increase random delays
3. Use residential proxies
4. Reduce automation frequency

### Debug Mode
```bash
# Enable verbose logging
LOG_LEVEL=debug node src/index.js [command]

# Enable Playwright debug
DEBUG=pw:api node src/index.js [command]
```

### Log Analysis
```bash
# View recent logs
tail -f logs/combined.log

# Filter error logs
grep "ERROR" logs/combined.log

# Session-specific logs
cat logs/session_123.log
```

### Performance Issues
1. **High Memory Usage**:
   - Reduce concurrent browser instances
   - Clear cache regularly
   - Use headless mode

2. **Slow Automation**:
   - Optimize selectors
   - Reduce wait times
   - Use faster proxies

3. **Network Timeouts**:
   - Increase timeout values
   - Check proxy connectivity
   - Verify internet connection

---

## Best Practices

### Security
1. **Never commit sensitive data**:
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo "configs/personal/" >> .gitignore
   ```

2. **Use environment variables**:
   ```javascript
   const apiKey = process.env.CAPTCHA_API_KEY;
   ```

3. **Rotate proxies regularly**
4. **Monitor for detection patterns**

### Performance
1. **Optimize monitoring intervals**:
   - High-demand items: 15-30 seconds
   - Regular items: 60-300 seconds
   - Low-priority: 10+ minutes

2. **Batch operations when possible**
3. **Use caching for repeated requests**
4. **Monitor resource usage**

### Reliability
1. **Always test configurations** before live use
2. **Set up proper error notifications**
3. **Keep backup configurations**
4. **Regular system updates**

### Legal and Ethical
1. **Respect rate limits** and terms of service
2. **Use for personal purchases only**
3. **Don't overwhelm servers** with excessive requests
4. **Follow site-specific guidelines**

### Maintenance
1. **Regular log cleanup**:
   ```bash
   # Weekly cleanup
   find logs/ -name "*.log" -mtime +7 -delete
   ```

2. **Update dependencies**:
   ```bash
   npm audit fix
   npm update
   ```

3. **Monitor system health**:
   ```bash
   # Check API status
   curl http://localhost:3001/api/health
   ```

---

## API Reference

### REST Endpoints

#### Health Check
```http
GET /api/health
```

#### Recording Management
```http
POST /api/recording/start
Body: { "url": "string", "sessionId": "string" }

POST /api/recording/stop/:sessionId

GET /api/recording/sessions

GET /api/recording/data/:sessionId
```

#### Monitor Management
```http
GET /api/monitor/products

POST /api/monitor/products
Body: { "name": "string", "url": "string", "site": "string" }

POST /api/monitor/start

GET /api/monitor/alerts
```

#### Automation
```http
GET /api/automation/configs

POST /api/automation/run/:automationId

GET /api/automation/logs
```

### WebSocket Events
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3001');

// Listen for events
socket.on('recording_started', (data) => {
  console.log('Recording started:', data);
});

socket.on('stock_alert', (alert) => {
  console.log('Stock alert:', alert);
});

socket.on('automation_completed', (result) => {
  console.log('Automation completed:', result);
});
```

---

## Support

### Getting Help
1. Check this manual first
2. Review log files for error messages
3. Check GitHub issues for known problems
4. Create detailed bug reports with:
   - System information
   - Log files
   - Steps to reproduce
   - Expected vs actual behavior

### Contributing
1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request with detailed description

### Updates
Keep your installation up to date:
```bash
git pull origin main
npm install
cd ui && npm install --legacy-peer-deps
```

---

*This manual covers the core functionality of Pokemayne Recorder. For the latest updates and advanced features, refer to the project documentation and changelog.*