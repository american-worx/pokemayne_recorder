# Pokemayne Recorder - Quick Start Guide

## Overview

Pokemayne Recorder is an advanced e-commerce checkout automation tool designed to capture and execute checkout flows for various online retailers. It provides a modular architecture with site-specific implementations, proxy management, CAPTCHA solving integration, and stealth browsing capabilities.

## Prerequisites

- Node.js v18.0.0 or higher
- npm or yarn package manager
- Git (for cloning the repository)

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd pokemayne_recorder
```

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npx playwright install
```

## Configuration

### Environment Variables

Create a `.env` file in the project root based on the `.env.example` template:

```bash
cp .env.example .env
```

Edit the `.env` file to configure your settings:

```env
# Browser settings
HEADLESS=true

# Proxy settings (optional)
PROXY_SERVER=
PROXY_USERNAME=
PROXY_PASSWORD=

# CAPTCHA solver API keys (optional)
CAPTCHA_2CAPTCHA_API_KEY=
CAPTCHA_ANTICAPTCHA_API_KEY=

# Logging
LOG_LEVEL=info
```

### Proxy Configuration

You can configure proxies in two ways:

1. **Environment Variables** (for single proxy):
   ```env
   PROXY_SERVER=http://proxy.example.com:8080
   PROXY_USERNAME=username
   PROXY_PASSWORD=password
   ```

2. **Proxy Pool Configuration** (for multiple proxies):
   Create a `proxies.json` file in the config directory:
   ```json
   [
     {
       "server": "127.0.0.1",
       "port": 8080,
       "username": "user1",
       "password": "pass1"
     },
     {
       "server": "127.0.0.2",
       "port": 8081,
       "username": "user2",
       "password": "pass2"
     }
   ]
   ```

### CAPTCHA Solver Configuration

To enable CAPTCHA solving, configure your API keys:

```env
CAPTCHA_2CAPTCHA_API_KEY=your_2captcha_api_key
CAPTCHA_ANTICAPTCHA_API_KEY=your_anticaptcha_api_key
```

## Supported Sites

The Pokemayne Recorder currently supports the following e-commerce sites:

- **Nike** - Full account management and checkout
- **Target** - Shape/Imperva bypass and cookie management
- **BestBuy** - GraphQL monitoring and wave detection
- **Walmart** - CAPTCHA solving and Akamai evasion
- **Shopify** - Generic Shopify store support
- **SauceDemo** - Test site for verification

## Usage

### Basic Execution

Run the recorder with default settings:

```bash
npm start
```

### Command Line Options

```bash
npm start -- --help
```

Common options include:

- `--site <site>` - Specify the target site (nike, target, bestbuy, walmart, shopify, saucedemo)
- `--mode <mode>` - Execution mode (record, execute, test)
- `--config <path>` - Path to flow configuration file
- `--headless <true|false>` - Run browser in headless mode
- `--verbose` - Enable verbose logging

### Example Usage

#### Record a Checkout Flow

```bash
npm start -- --site nike --mode record --config config/nike-flow.yaml
```

#### Execute a Checkout Flow

```bash
npm start -- --site nike --mode execute --config config/nike-flow.yaml
```

#### Test a Checkout Flow

```bash
npm start -- --site saucedemo --mode test --config config/saucedemo-flow.yaml
```

## Flow Configuration

Create YAML configuration files to define checkout flows. Example for Nike:

```yaml
# config/nike-flow.yaml
site: nike
product:
  url: "https://www.nike.com/product/12345"
  sku: "12345"

customer:
  email: "customer@example.com"
  shipping:
    first_name: "John"
    last_name: "Doe"
    address1: "123 Main St"
    city: "Anytown"
    state: "CA"
    zip_code: "12345"
    phone: "555-123-4567"

payment:
  card_number: "4111111111111111"
  expiry_month: "12"
  expiry_year: "2025"
  cvv: "123"
  cardholder_name: "John Doe"

steps:
  - action: "goto"
    url: "${product.url}"
    description: "Navigate to product page"
  
  - action: "click"
    selector: ".add-to-cart"
    description: "Add to cart"
  
  - action: "click"
    selector: ".checkout-button"
    description: "Proceed to checkout"
  
  - action: "fill"
    selector: "#email"
    value: "${customer.email}"
    description: "Enter email"
```

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Generate Test Reports

```bash
npm run test:report
```

## Development

### Project Structure

```
pokemayne_recorder/
├── src/
│   ├── core/          # Core components (ProxyManager, CaptchaSolver, etc.)
│   ├── modules/       # Site-specific modules
│   └── index.js       # Main entry point
├── tests/
│   ├── core/          # Unit tests for core components
│   ├── integration/   # Integration tests
│   ├── compatibility/ # Site compatibility tests
│   └── e2e/           # End-to-end tests
├── config/            # Configuration files
├── memory-bank/       # Documentation and site-specific information
└── reports/           # Generated test reports
```

### Adding New Site Modules

1. Create a new module file in `src/modules/` (e.g., `NewSiteModule.js`)
2. Extend the `BaseSiteModule` class
3. Implement required methods:
   - `initialize()`
   - `executeCheckout(page, flowConfig)`
   - `recordFlow(page)`
   - `handleCaptcha(page)`
   - `handleError(error, page)`
4. Register the module in `SiteModuleFactory.js`

### Core Components

#### ProxyManager
Manages proxy pools with health checking and automatic rotation.

#### CaptchaSolver
Integrates with 2Captcha and Anti-Captcha services for automated CAPTCHA solving.

#### BrowserManager
Handles browser instances with stealth capabilities and proxy integration.

## Troubleshooting

### Common Issues

1. **Browser not launching**: Ensure Playwright browsers are installed with `npx playwright install`

2. **CAPTCHA solving not working**: Verify your API keys are correctly configured

3. **Site-specific errors**: Check the site documentation in `memory-bank/sites/`

### Logging

Enable verbose logging to troubleshoot issues:

```bash
npm start -- --verbose
```

Logs are written to the `logs/` directory.

## Legal and Ethical Considerations

- Only use this tool on sites you have permission to automate
- Respect rate limits and terms of service
- Use proxies responsibly to avoid IP bans
- Store credentials securely
- Comply with applicable laws and regulations

## Support

For issues, feature requests, or questions, please:

1. Check the existing documentation in `memory-bank/`
2. Review the test reports in `reports/`
3. Open an issue on the repository

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

---

*Pokemayne Recorder - Advanced e-commerce automation tool*