#!/usr/bin/env node

/**
 * Pokemayne Recorder - Main Entry Point
 * Advanced e-commerce checkout automation tool
 */

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;
const cliProgress = require('cli-progress');
require('dotenv').config();

// Set up logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '..', 'logs', 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// CLI argument parsing
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <command> [options]')
  .command('record', 'Record a checkout flow', (yargs) => {
    return yargs
      .option('site', {
        alias: 's',
        describe: 'Target site (e.g., nike, target, bestbuy)',
        type: 'string',
        demandOption: true,
        choices: ['nike', 'target', 'bestbuy', 'saucedemo', 'walmart', 'shopify']
      })
      .option('url', {
        alias: 'u',
        describe: 'Product URL to record',
        type: 'string',
        demandOption: true
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file path',
        type: 'string'
      })
      .option('output', {
        alias: 'o',
        describe: 'Output directory for recorded flow',
        type: 'string',
        default: './flows'
      })
      .option('headless', {
        describe: 'Run browser in headless mode',
        type: 'boolean',
        default: true
      })
      .example('$0 record -s nike -u "https://www.nike.com/product" -o ./my-flows', 'Record a Nike checkout flow')
      .example('$0 record --site target --url "https://www.target.com/product" --headless false', 'Record a Target checkout flow with visible browser');
  })
  .command('execute', 'Execute a recorded checkout flow', (yargs) => {
    return yargs
      .option('site', {
        alias: 's',
        describe: 'Target site (e.g., nike, target, bestbuy)',
        type: 'string',
        demandOption: true,
        choices: ['nike', 'target', 'bestbuy', 'saucedemo', 'walmart', 'shopify']
      })
      .option('flow', {
        alias: 'f',
        describe: 'Flow file path',
        type: 'string',
        demandOption: true
      })
      .option('config', {
        alias: 'c',
        describe: 'Configuration file path',
        type: 'string'
      })
      .option('headless', {
        describe: 'Run browser in headless mode',
        type: 'boolean',
        default: true
      })
      .option('dry-run', {
        describe: 'Perform a dry run without actual checkout',
        type: 'boolean',
        default: false
      })
      .example('$0 execute -s nike -f ./flows/nike-flow.yaml', 'Execute a recorded Nike checkout flow')
      .example('$0 execute --site target --flow ./flows/target-flow.json --dry-run', 'Dry run a Target checkout flow');
  })
  .command('list-sites', 'List supported sites', () => {})
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .option('log-level', {
    describe: 'Set log level',
    choices: ['error', 'warn', 'info', 'debug'],
    default: 'info'
  })
  .middleware((argv) => {
    // Update logger level based on CLI options
    if (argv.verbose) {
      logger.level = 'debug';
    } else if (argv.logLevel) {
      logger.level = argv.logLevel;
    }
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'V')
  .epilogue('For more information, visit https://github.com/pokemayne/recorder')
  .argv;

// Main function
async function main() {
  // Load package.json with correct path
  let packageInfo = { version: '1.0.0' };
  try {
    packageInfo = require('../package.json');
  } catch (error) {
    logger.warn('Could not load package.json', { error: error.message });
  }
  
  logger.info('Pokemayne Recorder starting...', { 
    version: packageInfo.version,
    nodeVersion: process.version
  });
  
  try {
    // Handle different commands
    if (argv._.includes('record')) {
      logger.info('Recording checkout flow', { site: argv.site, url: argv.url });
      await recordFlow(argv);
    } else if (argv._.includes('execute')) {
      logger.info('Executing checkout flow', { site: argv.site, flow: argv.flow });
      await executeFlow(argv);
    } else if (argv._.includes('list-sites')) {
      logger.info('Listing supported sites');
      listSites();
    } else {
      yargs.showHelp();
    }
  } catch (error) {
    logger.error('Application error', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Record flow functionality
async function recordFlow(argv) {
  const startTime = Date.now();
  logger.info('Starting recording session', { startTime: new Date(startTime).toISOString() });
  
  try {
    // Import core components dynamically to avoid circular dependencies
    const BrowserManager = require('./core/BrowserManager');
    const RecorderEngine = require('./core/RecorderEngine');
    
    const browserManager = new BrowserManager(logger);
    const recorderEngine = new RecorderEngine(logger);
    
    // Launch browser with specified options
    const browserOptions = {
      headless: argv.headless
    };
    
    logger.info('Launching browser for recording', { options: browserOptions });
    const browser = await browserManager.launchBrowser(browserOptions);
    
    // Create a new context
    const { context } = await browserManager.createContext();
    const page = await context.newPage();
    
    logger.info('Starting recording session', { url: argv.url });
    await recorderEngine.startRecording(page);
    
    // Navigate to the specified URL
    await page.goto(argv.url, { waitUntil: 'networkidle' });
    
    // For now, we'll just wait for user to interact with the page
    console.log('Recording started. Interact with the page and press ENTER when done...');
    
    // Wait for user input to stop recording
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    return new Promise((resolve) => {
      process.stdin.once('data', async () => {
        try {
          logger.info('Stopping recording session');
          const recordingData = await recorderEngine.stopRecording();
          
          // Save recording to output directory
          const outputDir = argv.output;
          await fs.mkdir(outputDir, { recursive: true });
          
          const flowName = `${argv.site}-flow-${Date.now()}`;
          const outputPath = path.join(outputDir, flowName);
          
          await recorderEngine.saveRecording(recordingData, outputPath);
          
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`Recording saved to ${outputPath}`);
          console.log(`Recording completed in ${duration}ms`);
          logger.info('Recording completed and saved', { 
            outputPath, 
            duration,
            endTime: new Date(endTime).toISOString()
          });
          
          // Close browser
          await browserManager.closeAll();
          
          resolve();
        } catch (error) {
          logger.error('Error during recording', { error: error.message });
          await browserManager.closeAll();
          process.exit(1);
        }
      });
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error('Failed to record flow', { 
      error: error.message, 
      stack: error.stack,
      duration
    });
    throw error;
  }
}

// Execute flow functionality with progress monitoring
async function executeFlow(argv) {
  const startTime = Date.now();
  logger.info('Starting flow execution', { startTime: new Date(startTime).toISOString() });
  
  // Create progress bar
  let progressBar;
  
  try {
    // Import core components dynamically
    const BrowserManager = require('./core/BrowserManager');
    const ConfigurationManager = require('./core/ConfigurationManager');
    const FlowExecutor = require('./core/FlowExecutor');
    
    const browserManager = new BrowserManager(logger);
    const configManager = new ConfigurationManager(logger);
    const flowExecutor = new FlowExecutor(logger);
    
    // Load flow configuration
    logger.info('Loading flow configuration', { flow: argv.flow });
    const flowConfig = await configManager.loadFlow(argv.flow);
    
    // Load site-specific configuration if provided
    let siteConfig = {};
    if (argv.config) {
      logger.info('Loading site configuration', { config: argv.config });
      siteConfig = await configManager.loadConfig(argv.config);
    }
    
    // Launch browser with specified options
    const browserOptions = {
      headless: argv.headless
    };
    
    logger.info('Launching browser for execution', { options: browserOptions });
    const browser = await browserManager.launchBrowser(browserOptions);
    
    // Create a new context
    const { context } = await browserManager.createContext();
    const page = await context.newPage();
    
    // Merge configurations
    const variables = {
      ...flowConfig.variables,
      ...siteConfig.variables
    };
    
    // Set up progress monitoring
    const totalSteps = flowConfig.steps.length;
    
    if (argv.dryRun) {
      console.log('Dry run mode - not actually executing checkout');
      logger.info('Dry run completed');
    } else {
      // Create progress bar
      progressBar = new cliProgress.SingleBar({
        format: 'Execution Progress |{bar}| {percentage}% | ETA: {eta}s | {value}/{total} Steps',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });
      
      progressBar.start(totalSteps, 0);
      
      // Listen for progress events
      flowExecutor.on('progress', (data) => {
        progressBar.update(data.currentStep);
      });
      
      flowExecutor.on('complete', () => {
        progressBar.update(totalSteps);
      });
      
      flowExecutor.on('error', () => {
        if (progressBar) {
          progressBar.stop();
        }
      });
    }
    
    // Execute the flow
    logger.info('Executing flow', { 
      site: flowConfig.site, 
      steps: totalSteps,
      dryRun: argv.dryRun
    });
    
    if (argv.dryRun) {
      console.log('Dry run completed');
    } else {
      const result = await flowExecutor.executeFlow(page, flowConfig, variables);
      
      if (progressBar) {
        progressBar.stop();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (result.success) {
        console.log('Flow executed successfully!');
        console.log(`Execution completed in ${duration}ms`);
        console.log(`Completed ${result.completedSteps} steps`);
        
        logger.info('Flow execution completed successfully', { 
          duration,
          completedSteps: result.completedSteps,
          endTime: new Date(endTime).toISOString()
        });
      } else {
        console.log('Flow execution failed:', result.error);
        console.log(`Execution failed after ${duration}ms`);
        
        logger.error('Flow execution failed', { 
          error: result.error,
          failedSteps: result.failedSteps,
          duration,
          endTime: new Date(endTime).toISOString()
        });
      }
    }
    
    // Close browser
    await browserManager.closeAll();
    
  } catch (error) {
    if (progressBar) {
      progressBar.stop();
    }
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error('Failed to execute flow', { 
      error: error.message, 
      stack: error.stack,
      duration,
      endTime: new Date(endTime).toISOString()
    });
    throw error;
  }
}

// List supported sites
function listSites() {
  const sites = ['nike', 'target', 'bestbuy', 'saucedemo', 'walmart', 'shopify'];
  console.log('Supported sites:');
  sites.forEach(site => console.log(`  - ${site}`));
  
  console.log('\nExample usage:');
  console.log('  $ pokemayne record -s nike -u "https://www.nike.com/product"');
  console.log('  $ pokemayne execute -s target -f ./flows/target-flow.yaml');
}

// Run the application
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = { logger };