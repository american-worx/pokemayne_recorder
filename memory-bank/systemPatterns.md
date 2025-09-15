# System Patterns: Pokemayne Recorder

## System Architecture

### Core Architecture Overview
Pokemayne Recorder follows a modular, layered architecture designed for scalability and maintainability:

```
┌─────────────────┐
│   CLI Interface │
└─────────────────┘
         │
┌─────────────────┐
│  Flow Engine    │ ← Core orchestration
└─────────────────┘
         │
    ┌────┼────┐
    │         │
┌─────────┐ ┌─────────┐
│ Core    │ │ Site    │
│ Engine  │ │ Modules │
└─────────┘ └─────────┘
         │
┌─────────────────┐
│ Browser Layer   │ ← Playwright-Extra + Stealth
└─────────────────┘
```

## Key Technical Decisions

### 1. Modular Architecture Pattern
- **Decision**: Separate core functionality from site-specific implementations
- **Rationale**: Enables easy addition of new e-commerce platforms without modifying core code
- **Implementation**: Core engine handles browser management, site modules handle platform-specific logic

### 2. Two-Phase Execution Model
- **Decision**: Capture phase (manual analysis) followed by execution phase (automated)
- **Rationale**: Ensures accuracy and adaptability to site changes
- **Implementation**: Flow definitions stored as YAML/JSON, executed by flow engine

### 3. Stealth-First Design
- **Decision**: Anti-detection measures built into every layer
- **Rationale**: Primary requirement for successful automation
- **Implementation**: Stealth plugin integration, randomization, human-like patterns

## Design Patterns

### Factory Pattern: Site Module Creation
```javascript
// Site modules created dynamically based on configuration
const siteModule = SiteFactory.create(config.site);
await siteModule.executeCheckout(page, config);
```

### Strategy Pattern: Checkout Flow Execution
```javascript
// Different execution strategies for different scenarios
const strategy = config.apiFirst ? new ApiStrategy() : new BrowserStrategy();
await strategy.execute(flow, context);
```

### Observer Pattern: Flow Monitoring
```javascript
// Event-driven monitoring and logging
flowEngine.on('stepComplete', (step) => logger.info(`Completed: ${step.action}`));
flowEngine.on('error', (error) => recoveryHandler.handle(error));
```

### Builder Pattern: Flow Configuration
```javascript
// Fluent API for building checkout flows
const flow = new FlowBuilder()
  .goto(productUrl)
  .selectVariant(size)
  .addToCart()
  .proceedToCheckout()
  .fillShipping(shippingInfo)
  .fillPayment(paymentInfo)
  .submitOrder()
  .build();
```

## Component Relationships

### Core Engine Components

#### BrowserManager
- **Responsibility**: Manages browser instances and contexts
- **Key Methods**:
  - `launchStealthyBrowser()`: Creates browser with stealth configuration
  - `createContext()`: Sets up isolated browsing context
  - `rotateProxy()`: Changes proxy for new context
- **Dependencies**: Playwright-Extra, Stealth Plugin

#### FlowExecutor
- **Responsibility**: Orchestrates checkout flow execution
- **Key Methods**:
  - `executeFlow()`: Runs complete checkout process
  - `executeStep()`: Performs individual flow steps
  - `handleError()`: Manages execution failures
- **Dependencies**: BrowserManager, Site Modules

#### ConfigurationManager
- **Responsibility**: Loads and validates flow configurations
- **Key Methods**:
  - `loadFlow()`: Parses YAML/JSON flow definitions
  - `validateConfig()`: Ensures configuration completeness
  - `mergeDefaults()`: Applies default values
- **Dependencies**: File system, YAML/JSON parsers

### Site Module Components

#### BaseSiteModule
- **Responsibility**: Abstract base class for all site implementations
- **Key Methods**:
  - `initialize()`: Setup site-specific configuration
  - `executeCheckout()`: Main checkout execution method
  - `handleCaptcha()`: CAPTCHA detection and solving
- **Dependencies**: FlowExecutor, BrowserManager

#### Site-Specific Modules (e.g., NikeModule, ShopifyModule)
- **Responsibility**: Platform-specific checkout implementations
- **Key Methods**:
  - `selectVariant()`: Product variant selection
  - `addToCart()`: Cart addition logic
  - `fillCheckoutForm()`: Form filling with site-specific selectors
- **Dependencies**: BaseSiteModule, site-specific selectors/APIs

## Critical Implementation Paths

### 1. Browser Launch Sequence
```
Launch Request → Stealth Plugin Setup → Context Creation → Proxy Configuration → Browser Ready
```

### 2. Checkout Flow Execution
```
Load Config → Validate Parameters → Launch Browser → Navigate to Product → Execute Steps → Handle Errors → Cleanup
```

### 3. Error Recovery Flow
```
Error Detected → Log Error → Attempt Retry → Escalate if Failed → Fallback Strategy → Recovery Complete
```

## Data Flow Patterns

### Configuration Flow
```
CLI Args → Config Parser → Validation → Flow Definition → Site Module → Execution
```

### Browser Interaction Flow
```
User Action → Flow Step → Selector Resolution → Element Interaction → Wait Strategy → Success/Failure
```

### Monitoring Flow
```
Execution Event → Logger → Metrics Collector → Alert System → User Notification
```

## State Management

### Browser Context State
- **Session Data**: Cookies, localStorage, sessionStorage
- **Fingerprint State**: Canvas, WebGL, navigator properties
- **Network State**: Headers, proxy configuration

### Flow Execution State
- **Current Step**: Active flow step being executed
- **Progress State**: Completed vs. remaining steps
- **Error State**: Failure history and recovery attempts

### Application State
- **Configuration State**: Loaded flow definitions and settings
- **Module State**: Available site modules and their status
- **Performance State**: Execution metrics and success rates

## Communication Patterns

### Synchronous Communication
- **Method Calls**: Direct function invocation within same context
- **Event Emission**: Observer pattern for component communication
- **Promise Chains**: Async operation sequencing

### Asynchronous Communication
- **Event Listeners**: Non-blocking event handling
- **Callback Functions**: Error and completion handling
- **Stream Processing**: Real-time log and metric streaming

## Security Patterns

### Stealth Implementation
- **Fingerprint Randomization**: Dynamic property modification
- **Timing Randomization**: Human-like delays and patterns
- **Request Throttling**: Rate limiting to avoid detection

### Data Protection
- **Credential Encryption**: Secure storage of sensitive data
- **Session Isolation**: Separate contexts for different executions
- **Cleanup Procedures**: Automatic removal of sensitive data

## Performance Patterns

### Resource Management
- **Browser Pooling**: Reuse browser instances when possible
- **Memory Optimization**: Efficient DOM interaction patterns
- **Concurrent Execution**: Parallel processing where safe

### Optimization Strategies
- **Lazy Loading**: Load modules only when needed
- **Caching**: Cache frequently used selectors and configurations
- **Batch Processing**: Group similar operations for efficiency
