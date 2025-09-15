# Pokemayne Recorder

Advanced e-commerce checkout automation tool designed to capture and execute checkout flows for various online retailers.

## Overview

Pokemayne Recorder is a sophisticated automation tool that uses Playwright-Extra with stealth capabilities to bypass anti-bot detection systems while maintaining human-like behavior patterns. The tool can record e-commerce checkout processes and then execute them automatically with configurable parameters.

## Features

- **Flow Capture**: Analyze and record e-commerce checkout processes from product page to order confirmation
- **Flow Execution**: Automate checkout processes with configurable parameters (size, payment, shipping)
- **Anti-Detection**: Implement stealth techniques to bypass bot detection systems (Akamai, PerimeterX, DataDome)
- **Multi-Site Support**: Modular architecture supporting different e-commerce platforms (Nike, Shopify, etc.)
- **Proxy Rotation**: Dynamic proxy management for IP rotation
- **CAPTCHA Handling**: Integration with CAPTCHA solving services
- **Concurrent Execution**: Support for parallel checkout processing

## Prerequisites

- Node.js v18+
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd pokemayne-recorder

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

## Usage

### Record a Checkout Flow

```bash
npm start -- record --site nike --url "https://www.nike.com/product-url"
```

### Execute a Recorded Flow

```bash
npm start -- execute --site nike --flow ./config/nike/flow.yaml
```

### List Supported Sites

```bash
npm start -- list-sites
```

## Project Structure

```
pokemayne-recorder/
├── src/                 # Source code
├── config/              # Configuration files
├── modules/             # Site-specific modules
├── tests/               # Test files
├── logs/                # Log files
├── memory-bank/         # Documentation and context
├── package.json         # Project dependencies
└── README.md            # This file
```

## Configuration

The tool uses environment variables for configuration. See `.env.example` for available options.

## Supported Sites

- Nike
- Target
- BestBuy
- SauceDemo (for testing)

## Development

### Running Tests

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Legal Compliance

This tool is designed for educational and research purposes. Users must ensure all usage complies with:
- Website Terms of Service
- Applicable laws and regulations
- Ethical guidelines for web scraping and automation

The developers are not responsible for any misuse of this tool.

## License

MIT License - see LICENSE file for details.