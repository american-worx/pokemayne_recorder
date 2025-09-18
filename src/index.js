#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';

// Core modules
import StealthyRecorder from './recorder/stealthy-recorder.js';
import InventoryMonitor from './monitor/inventory-monitor.js';
import WalmartModule from './modules/walmart-module.js';
import BrowserManager from './core/browser-manager.js';
import logger from './core/utils/logger.js';

class PokemayneRecorder {
  constructor() {
    this.version = '1.0.0';
    this.configDir = 'configs';
  }

  async init() {
    console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════╗
║        🎯 POKEMAYNE RECORDER v${this.version}        ║
║   Advanced E-commerce Automation Suite    ║
║        Better than Stellar AIO            ║
╚═══════════════════════════════════════════╝
    `));

    // Ensure directories exist
    await this.ensureDirectories();

    // Setup CLI commands
    this.setupCLI();
  }

  async ensureDirectories() {
    const dirs = ['logs', 'recordings', 'configs', 'monitor-data'];
    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  setupCLI() {
    yargs(hideBin(process.argv))
      .command('record <url>', 'Start recording a site flow', (yargs) => {
        yargs
          .positional('url', {
            describe: 'URL to record',
            type: 'string'
          })
          .option('session', {
            alias: 's',
            describe: 'Session ID',
            type: 'string',
            default: `session_${Date.now()}`
          })
          .option('output', {
            alias: 'o',
            describe: 'Output directory',
            type: 'string',
            default: 'recordings'
          })
          .option('headless', {
            describe: 'Run in headless mode',
            type: 'boolean',
            default: false
          });
      }, this.handleRecord.bind(this))

      .command('monitor', 'Start inventory monitoring', () => {}, this.handleMonitor.bind(this))

      .command('run <config>', 'Run automation with config file', (yargs) => {
        yargs
          .positional('config', {
            describe: 'Configuration file path',
            type: 'string'
          })
          .option('headless', {
            describe: 'Run in headless mode',
            type: 'boolean',
            default: true
          })
          .option('proxy', {
            describe: 'Proxy server (http://user:pass@host:port)',
            type: 'string'
          });
      }, this.handleRun.bind(this))

      .command('create-config', 'Create a new configuration file', () => {}, this.handleCreateConfig.bind(this))

      .command('pokemon-walmart', 'Quick setup for Pokemon cards on Walmart', () => {}, this.handlePokemonWalmart.bind(this))

      .option('verbose', {
        alias: 'v',
        describe: 'Verbose logging',
        type: 'boolean',
        default: false
      })

      .help()
      .alias('help', 'h')
      .version(this.version)
      .alias('version', 'V')
      .demandCommand(1, 'You need at least one command before moving on')
      .parse();
  }

  async handleRecord(argv) {
    const spinner = ora('Starting stealthy recorder...').start();

    try {
      const recorder = new StealthyRecorder({
        sessionId: argv.session,
        outputDir: argv.output,
        headless: argv.headless
      });

      spinner.succeed('Recorder initialized');
      console.log(chalk.green(`Recording session: ${argv.session}`));
      console.log(chalk.yellow(`Target URL: ${argv.url}`));

      const { page } = await recorder.startRecording(argv.url);

      console.log(chalk.blue('\n📹 Recording started! Interact with the page normally.'));
      console.log(chalk.gray('Press Ctrl+C to stop recording and save the session.\n'));

      // Keep the process alive until user stops
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n\n🛑 Stopping recording...'));
        const result = await recorder.stopRecording();

        console.log(chalk.green('✅ Recording saved!'));
        console.log(chalk.blue(`📁 Session: ${result.sessionId}`));
        console.log(chalk.blue(`📊 Duration: ${Math.round(result.duration / 1000)}s`));
        console.log(chalk.blue(`🔗 Actions: ${result.stats.actions}`));
        console.log(chalk.blue(`🌐 Requests: ${result.stats.requests}`));
        console.log(chalk.blue(`🔒 CAPTCHAs: ${result.stats.captchas}`));

        process.exit(0);
      });

    } catch (error) {
      spinner.fail(`Recording failed: ${error.message}`);
      logger.error('Recording error', { error: error.message, argv });
      process.exit(1);
    }
  }

  async handleMonitor(argv) {
    console.log(chalk.blue('🔍 Starting inventory monitoring setup...\n'));

    // Interactive setup
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'productName',
        message: 'What product do you want to monitor?',
        default: 'Pokemon Cards'
      },
      {
        type: 'input',
        name: 'productUrl',
        message: 'Enter the product URL:',
        validate: (input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'list',
        name: 'site',
        message: 'Which site is this?',
        choices: ['walmart', 'target', 'bestbuy', 'other']
      },
      {
        type: 'input',
        name: 'checkInterval',
        message: 'Check interval (in seconds):',
        default: '30',
        validate: (input) => {
          const num = parseInt(input);
          return num > 0 ? true : 'Please enter a positive number';
        }
      },
      {
        type: 'confirm',
        name: 'enableNotifications',
        message: 'Enable Discord notifications?',
        default: false
      }
    ]);

    if (answers.enableNotifications) {
      const notificationAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'discordWebhook',
          message: 'Discord webhook URL:',
          validate: (input) => input.includes('discord.com') ? true : 'Invalid Discord webhook URL'
        }
      ]);
      answers.discordWebhook = notificationAnswers.discordWebhook;
    }

    const spinner = ora('Setting up inventory monitor...').start();

    try {
      const monitor = new InventoryMonitor({
        checkInterval: `*/${answers.checkInterval} * * * * *`
      });

      const notifications = [];
      if (answers.enableNotifications) {
        notifications.push({
          type: 'discord',
          webhookUrl: answers.discordWebhook
        });
      }

      const productId = await monitor.addProduct({
        name: answers.productName,
        url: answers.productUrl,
        site: answers.site,
        notifications,
        conditions: {
          inStock: true
        }
      });

      await monitor.startMonitoring();

      spinner.succeed('Inventory monitoring started!');

      console.log(chalk.green('✅ Monitor configured successfully!'));
      console.log(chalk.blue(`📦 Product: ${answers.productName}`));
      console.log(chalk.blue(`🔗 URL: ${answers.productUrl}`));
      console.log(chalk.blue(`⏱️  Check interval: ${answers.checkInterval}s`));
      console.log(chalk.blue(`🔔 Notifications: ${answers.enableNotifications ? 'Enabled' : 'Disabled'}`));

      console.log(chalk.yellow('\n📊 Monitor running... Press Ctrl+C to stop.\n'));

      // Show stats periodically
      const statsInterval = setInterval(() => {
        const stats = monitor.getMonitoringStats();
        console.log(chalk.gray(`[${new Date().toLocaleTimeString()}] Monitoring ${stats.totalProducts} products, ${stats.recentAlerts} recent alerts`));
      }, 60000);

      process.on('SIGINT', async () => {
        clearInterval(statsInterval);
        console.log(chalk.yellow('\n🛑 Stopping monitor...'));
        await monitor.stopMonitoring();
        console.log(chalk.green('✅ Monitor stopped!'));
        process.exit(0);
      });

    } catch (error) {
      spinner.fail(`Monitor setup failed: ${error.message}`);
      logger.error('Monitor error', { error: error.message });
      process.exit(1);
    }
  }

  async handleRun(argv) {
    const spinner = ora('Loading configuration...').start();

    try {
      // Load configuration
      const configPath = path.resolve(argv.config);
      const config = await fs.readJson(configPath);

      spinner.text = 'Initializing automation...';

      // Initialize appropriate module based on site
      let module;
      switch (config.site) {
        case 'walmart':
          module = new WalmartModule(config.options);
          break;
        default:
          throw new Error(`Unsupported site: ${config.site}`);
      }

      // Launch browser
      const browserManager = new BrowserManager({
        headless: argv.headless,
        proxy: argv.proxy ? { server: argv.proxy } : null,
        stealthLevel: config.options?.stealthLevel || 'ultra'
      });

      const browser = await browserManager.launchStealthyBrowser();
      const context = await browserManager.createStealthyContext(browser);
      const page = await context.newPage();

      spinner.succeed('Automation initialized');

      console.log(chalk.green('🚀 Starting checkout automation...'));
      console.log(chalk.blue(`🛒 Site: ${config.site}`));
      console.log(chalk.blue(`🎯 Product: ${config.product.url}`));

      // Execute checkout
      const result = await module.executeCheckout(page, config);

      // Cleanup
      await page.close();
      await context.close();
      await browser.close();

      if (result.success) {
        console.log(chalk.green.bold('\n🎉 CHECKOUT SUCCESSFUL! 🎉'));
        console.log(chalk.blue(`📋 Order Number: ${result.orderNumber}`));
        console.log(chalk.blue(`⏱️  Duration: ${Math.round((Date.now() - result.timestamp) / 1000)}s`));
      } else {
        console.log(chalk.red('\n❌ Checkout failed'));
      }

    } catch (error) {
      spinner.fail(`Automation failed: ${error.message}`);
      logger.error('Automation error', { error: error.message, config: argv.config });
      process.exit(1);
    }
  }

  async handleCreateConfig() {
    console.log(chalk.blue('📝 Creating new configuration...\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Configuration name:',
        default: 'my-config'
      },
      {
        type: 'list',
        name: 'site',
        message: 'Target site:',
        choices: ['walmart', 'target', 'bestbuy']
      },
      {
        type: 'input',
        name: 'productUrl',
        message: 'Product URL:',
        validate: (input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'input',
        name: 'email',
        message: 'Customer email:',
        validate: (input) => input.includes('@') ? true : 'Invalid email'
      }
    ]);

    // Collect shipping info
    console.log(chalk.yellow('\n📦 Shipping Information:'));
    const shipping = await inquirer.prompt([
      { type: 'input', name: 'firstName', message: 'First name:' },
      { type: 'input', name: 'lastName', message: 'Last name:' },
      { type: 'input', name: 'address1', message: 'Address:' },
      { type: 'input', name: 'city', message: 'City:' },
      { type: 'input', name: 'state', message: 'State (2-letter code):' },
      { type: 'input', name: 'zipCode', message: 'ZIP code:' },
      { type: 'input', name: 'phone', message: 'Phone number:' }
    ]);

    // Collect payment info
    console.log(chalk.yellow('\n💳 Payment Information:'));
    const payment = await inquirer.prompt([
      { type: 'input', name: 'cardNumber', message: 'Card number:' },
      { type: 'input', name: 'expiryMonth', message: 'Expiry month (MM):' },
      { type: 'input', name: 'expiryYear', message: 'Expiry year (YYYY):' },
      { type: 'input', name: 'cvv', message: 'CVV:' },
      { type: 'input', name: 'cardholderName', message: 'Cardholder name:' }
    ]);

    const config = {
      site: answers.site,
      product: {
        url: answers.productUrl,
        sku: null
      },
      customer: {
        email: answers.email,
        shipping,
        payment
      },
      options: {
        stealthLevel: 'ultra',
        maxRetries: 3,
        timeout: 60000,
        humanBehavior: true
      }
    };

    const configPath = path.join(this.configDir, `${answers.name}.json`);
    await fs.writeJson(configPath, config, { spaces: 2 });

    console.log(chalk.green(`\n✅ Configuration saved: ${configPath}`));
    console.log(chalk.blue(`Run with: npm start run ${configPath}`));
  }

  async handlePokemonWalmart() {
    console.log(chalk.blue('🎯 Quick setup for Pokemon cards on Walmart!\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'productUrl',
        message: 'Walmart Pokemon product URL:',
        validate: (input) => {
          try {
            const url = new URL(input);
            return url.hostname.includes('walmart.com') ? true : 'Must be a Walmart URL';
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '📹 Record the checkout flow', value: 'record' },
          { name: '🔍 Monitor for stock', value: 'monitor' },
          { name: '🚀 Setup complete automation', value: 'automate' }
        ]
      }
    ]);

    switch (answers.action) {
      case 'record':
        await this.handleRecord({
          url: answers.productUrl,
          session: `pokemon_walmart_${Date.now()}`,
          output: 'recordings',
          headless: false
        });
        break;

      case 'monitor':
        const monitor = new InventoryMonitor();
        await monitor.addProduct({
          name: 'Pokemon Cards (Walmart)',
          url: answers.productUrl,
          site: 'walmart',
          conditions: { inStock: true }
        });
        await monitor.startMonitoring();

        console.log(chalk.green('✅ Pokemon monitoring started!'));
        console.log(chalk.yellow('📊 Monitor running... Press Ctrl+C to stop.\n'));

        process.on('SIGINT', async () => {
          await monitor.stopMonitoring();
          process.exit(0);
        });
        break;

      case 'automate':
        console.log(chalk.yellow('🔧 Complete automation requires configuration setup.'));
        console.log(chalk.blue('Use: npm start create-config'));
        break;
    }
  }
}

// Initialize and run
const app = new PokemayneRecorder();
app.init().catch(console.error);

export default PokemayneRecorder;