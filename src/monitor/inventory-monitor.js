import BrowserManager from '../core/browser-manager.js';
import logger from '../core/utils/logger.js';
import cron from 'node-cron';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

class InventoryMonitor {
  constructor(options = {}) {
    this.options = {
      checkInterval: options.checkInterval || '*/30 * * * * *', // Every 30 seconds
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000,
      notifications: options.notifications || [],
      outputDir: options.outputDir || 'monitor-data',
      stealthLevel: options.stealthLevel || 'ultra',
      proxy: options.proxy || null,
      ...options
    };

    this.browserManager = new BrowserManager({
      headless: true,
      stealthLevel: this.options.stealthLevel,
      proxy: this.options.proxy
    });

    this.monitoredProducts = new Map();
    this.cronJobs = new Map();
    this.isMonitoring = false;
    this.alerts = [];
    this.stockHistory = [];
  }

  async addProduct(productConfig) {
    const productId = productConfig.id || `product_${Date.now()}`;

    const product = {
      id: productId,
      name: productConfig.name,
      url: productConfig.url,
      site: productConfig.site || 'walmart',
      selectors: productConfig.selectors || this.getDefaultSelectors(productConfig.site),
      checkInterval: productConfig.checkInterval || this.options.checkInterval,
      notifications: productConfig.notifications || this.options.notifications,
      conditions: productConfig.conditions || {
        inStock: true,
        priceMax: null,
        priceMin: null,
        keywords: []
      },
      metadata: {
        sku: productConfig.sku,
        upc: productConfig.upc,
        category: productConfig.category || 'pokemon-cards'
      },
      lastCheck: null,
      status: 'pending',
      stockHistory: [],
      retryCount: 0
    };

    this.monitoredProducts.set(productId, product);

    logger.monitorEvent('product_added', {
      productId,
      name: product.name,
      url: product.url,
      site: product.site
    });

    return productId;
  }

  getDefaultSelectors(site) {
    const selectors = {
      walmart: {
        availability: [
          '.prod-ProductCTA .prod-ProductCTAButton',
          '[data-testid="add-to-cart-button"]',
          '#add-to-cart-btn',
          '.add-to-cart-button'
        ],
        price: [
          '.prod-PriceSection .price-characteristic',
          '[data-testid="price-current"]',
          '.price-current',
          '.price'
        ],
        title: [
          '.prod-ProductTitle',
          '[data-testid="product-title"]',
          'h1'
        ],
        outOfStock: [
          '.prod-ProductOOS',
          '[data-testid="out-of-stock"]',
          '.out-of-stock',
          '.unavailable'
        ],
        itemDemand: [
          '[data-testid="item-demand"]',
          '.high-demand-message',
          '.queue-required'
        ]
      },
      target: {
        availability: [
          '[data-test="orderPickupButton"]',
          '[data-test="shipItButton"]',
          '.Button-primary'
        ],
        price: [
          '[data-test="product-price"]',
          '.price-current',
          '.Price'
        ],
        title: [
          '[data-test="product-title"]',
          'h1'
        ],
        outOfStock: [
          '[data-test="outOfStock"]',
          '.out-of-stock'
        ]
      },
      bestbuy: {
        availability: [
          '.add-to-cart-button',
          '.fulfillment-add-to-cart-button'
        ],
        price: [
          '.price-current',
          '.sr-only:contains("current price")'
        ],
        title: [
          '.sku-title',
          'h1'
        ],
        outOfStock: [
          '.sold-out',
          '.out-of-stock'
        ]
      }
    };

    return selectors[site] || selectors.walmart;
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      logger.monitorEvent('monitoring_already_started');
      return;
    }

    this.isMonitoring = true;

    // Start monitoring each product
    for (const [productId, product] of this.monitoredProducts) {
      await this.scheduleProductCheck(productId, product);
    }

    logger.monitorEvent('monitoring_started', {
      productCount: this.monitoredProducts.size
    });
  }

  async scheduleProductCheck(productId, product) {
    const cronJob = cron.schedule(product.checkInterval, async () => {
      await this.checkProduct(productId);
    }, {
      scheduled: false
    });

    this.cronJobs.set(productId, cronJob);
    cronJob.start();

    // Initial check
    await this.checkProduct(productId);
  }

  async checkProduct(productId) {
    const product = this.monitoredProducts.get(productId);
    if (!product) return;

    logger.monitorEvent('checking_product', {
      productId,
      name: product.name,
      url: product.url
    });

    try {
      const browser = await this.browserManager.launchStealthyBrowser(`monitor_${productId}`);
      const context = await this.browserManager.createStealthyContext(browser, `monitor_${productId}`);
      const page = await context.newPage();

      // Navigate to product page
      await page.goto(product.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Extract product data
      const productData = await this.extractProductData(page, product);

      // Update product status
      product.lastCheck = Date.now();
      product.retryCount = 0;

      // Analyze stock status
      const stockStatus = this.analyzeStockStatus(productData, product);

      // Record stock history
      const stockEntry = {
        timestamp: Date.now(),
        ...stockStatus,
        price: productData.price,
        url: product.url
      };

      product.stockHistory.push(stockEntry);
      this.stockHistory.push(stockEntry);

      // Check for stock alerts
      await this.checkStockAlerts(product, stockStatus, productData);

      // Save monitoring data
      await this.saveMonitoringData();

      // Cleanup
      await page.close();
      await context.close();
      await browser.close();

      logger.monitorEvent('product_checked', {
        productId,
        stockStatus: stockStatus.status,
        price: productData.price,
        available: stockStatus.available
      });

    } catch (error) {
      product.retryCount++;

      logger.error(`Product check failed: ${product.name}`, {
        productId,
        error: error.message,
        retryCount: product.retryCount,
        url: product.url
      });

      // Retry logic
      if (product.retryCount < this.options.maxRetries) {
        setTimeout(() => {
          this.checkProduct(productId);
        }, this.options.retryDelay * product.retryCount);
      } else {
        product.status = 'error';
        logger.monitorEvent('product_check_failed', {
          productId,
          name: product.name,
          error: error.message
        });
      }
    }
  }

  async extractProductData(page, product) {
    const data = await page.evaluate((selectors) => {
      const findElement = (selectorArray) => {
        for (const selector of selectorArray) {
          const element = document.querySelector(selector);
          if (element && element.offsetHeight > 0) {
            return element;
          }
        }
        return null;
      };

      const result = {
        title: null,
        price: null,
        availability: null,
        outOfStock: false,
        itemDemand: false,
        buttonText: null,
        timestamp: Date.now()
      };

      // Extract title
      const titleElement = findElement(selectors.title);
      if (titleElement) {
        result.title = titleElement.textContent?.trim();
      }

      // Extract price
      const priceElement = findElement(selectors.price);
      if (priceElement) {
        const priceText = priceElement.textContent?.trim();
        const priceMatch = priceText?.match(/\$?(\d+\.?\d*)/);
        if (priceMatch) {
          result.price = parseFloat(priceMatch[1]);
        }
      }

      // Check availability button
      const availabilityElement = findElement(selectors.availability);
      if (availabilityElement) {
        result.availability = true;
        result.buttonText = availabilityElement.textContent?.trim();
      }

      // Check out of stock indicators
      const outOfStockElement = findElement(selectors.outOfStock);
      if (outOfStockElement) {
        result.outOfStock = true;
      }

      // Check item demand indicators
      const itemDemandElement = findElement(selectors.itemDemand);
      if (itemDemandElement) {
        result.itemDemand = true;
      }

      return result;
    }, product.selectors);

    // Additional checks via API if available
    if (product.site === 'walmart' && product.metadata.sku) {
      try {
        const apiData = await this.checkWalmartAPI(page, product.metadata.sku);
        data.apiData = apiData;
      } catch (error) {
        logger.error('Walmart API check failed', { error: error.message });
      }
    }

    return data;
  }

  async checkWalmartAPI(page, sku) {
    return await page.evaluate(async (sku) => {
      try {
        const response = await fetch(`/api/v1/items/${sku}/inventory`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': navigator.userAgent
          }
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('API check failed:', error.message);
      }
      return null;
    }, sku);
  }

  analyzeStockStatus(productData, _product) {
    let status = 'unknown';
    let available = false;
    let confidence = 0;

    // Analyze based on multiple signals
    if (productData.outOfStock) {
      status = 'out_of_stock';
      available = false;
      confidence = 0.9;
    } else if (productData.itemDemand) {
      status = 'high_demand';
      available = true;
      confidence = 0.8;
    } else if (productData.availability && productData.buttonText) {
      const buttonText = productData.buttonText.toLowerCase();

      if (buttonText.includes('add to cart') || buttonText.includes('buy now')) {
        status = 'in_stock';
        available = true;
        confidence = 0.95;
      } else if (buttonText.includes('notify') || buttonText.includes('waitlist')) {
        status = 'out_of_stock';
        available = false;
        confidence = 0.9;
      } else if (buttonText.includes('unavailable') || buttonText.includes('sold out')) {
        status = 'out_of_stock';
        available = false;
        confidence = 0.95;
      }
    }

    // API data override
    if (productData.apiData) {
      if (productData.apiData.available === false) {
        status = 'out_of_stock';
        available = false;
        confidence = 0.99;
      } else if (productData.apiData.available === true) {
        status = 'in_stock';
        available = true;
        confidence = 0.99;
      }
    }

    return {
      status,
      available,
      confidence,
      signals: {
        outOfStock: productData.outOfStock,
        itemDemand: productData.itemDemand,
        buttonText: productData.buttonText,
        hasAPI: !!productData.apiData
      }
    };
  }

  async checkStockAlerts(product, stockStatus, productData) {
    const previousStatus = product.stockHistory.length > 1 ?
      product.stockHistory[product.stockHistory.length - 2] : null;

    // Stock change alert
    if (previousStatus && previousStatus.available !== stockStatus.available) {
      const alert = {
        type: stockStatus.available ? 'stock_available' : 'stock_unavailable',
        productId: product.id,
        productName: product.name,
        url: product.url,
        timestamp: Date.now(),
        previousStatus: previousStatus.status,
        newStatus: stockStatus.status,
        price: productData.price,
        confidence: stockStatus.confidence
      };

      this.alerts.push(alert);

      logger.monitorEvent('stock_alert', alert);

      // Trigger notifications
      if (stockStatus.available && product.conditions.inStock) {
        await this.triggerNotifications(alert, product);
      }
    }

    // Price alert
    if (productData.price && product.conditions.priceMax && productData.price <= product.conditions.priceMax) {
      const alert = {
        type: 'price_target',
        productId: product.id,
        productName: product.name,
        url: product.url,
        timestamp: Date.now(),
        price: productData.price,
        targetPrice: product.conditions.priceMax
      };

      this.alerts.push(alert);
      logger.monitorEvent('price_alert', alert);
      await this.triggerNotifications(alert, product);
    }
  }

  async triggerNotifications(alert, product) {
    for (const notification of product.notifications) {
      try {
        switch (notification.type) {
          case 'webhook':
            await this.sendWebhookNotification(alert, notification);
            break;
          case 'email':
            await this.sendEmailNotification(alert, notification);
            break;
          case 'discord':
            await this.sendDiscordNotification(alert, notification);
            break;
          case 'desktop':
            await this.sendDesktopNotification(alert, notification);
            break;
        }
      } catch (error) {
        logger.error('Notification failed', {
          type: notification.type,
          error: error.message,
          alert
        });
      }
    }
  }

  async sendWebhookNotification(alert, notification) {

    const payload = {
      alert,
      timestamp: Date.now(),
      service: 'pokemayne-recorder'
    };

    await axios.post(notification.url, payload, {
      headers: notification.headers || {}
    });

    logger.monitorEvent('webhook_notification_sent', { url: notification.url });
  }

  async sendDiscordNotification(alert, notification) {

    const embed = {
      title: `🎯 ${alert.type.replace('_', ' ').toUpperCase()}`,
      description: `**${alert.productName}** is now ${alert.type === 'stock_available' ? 'IN STOCK!' : 'out of stock'}`,
      color: alert.type === 'stock_available' ? 0x00ff00 : 0xff0000,
      fields: [
        {
          name: 'Price',
          value: alert.price ? `$${alert.price}` : 'Unknown',
          inline: true
        },
        {
          name: 'Confidence',
          value: `${Math.round(alert.confidence * 100)}%`,
          inline: true
        },
        {
          name: 'URL',
          value: alert.url,
          inline: false
        }
      ],
      timestamp: new Date().toISOString()
    };

    await axios.post(notification.webhookUrl, {
      embeds: [embed]
    });

    logger.monitorEvent('discord_notification_sent');
  }

  async sendDesktopNotification(alert, _notification) {
    // For desktop notifications, we'll use a simple console log for now
    // In a real implementation, you'd use libraries like node-notifier
    console.log(`🔔 STOCK ALERT: ${alert.productName} - ${alert.type}`);
    logger.monitorEvent('desktop_notification_sent');
  }

  async saveMonitoringData() {
    try {
      const outputPath = path.join(this.options.outputDir);
      await fs.ensureDir(outputPath);

      // Save current state
      const stateData = {
        timestamp: Date.now(),
        products: Array.from(this.monitoredProducts.values()),
        alerts: this.alerts,
        stockHistory: this.stockHistory.slice(-1000) // Keep last 1000 entries
      };

      await fs.writeJson(path.join(outputPath, 'monitoring-state.json'), stateData, { spaces: 2 });

      // Save daily logs
      const today = new Date().toISOString().split('T')[0];
      const dailyLogPath = path.join(outputPath, 'daily-logs', `${today}.json`);
      await fs.ensureDir(path.dirname(dailyLogPath));

      const existingDailyData = await fs.readJson(dailyLogPath).catch(() => ({ checks: [], alerts: [] }));
      existingDailyData.checks.push(...this.stockHistory.slice(-10));
      existingDailyData.alerts.push(...this.alerts.slice(-10));

      await fs.writeJson(dailyLogPath, existingDailyData, { spaces: 2 });

    } catch (error) {
      logger.error('Failed to save monitoring data', { error: error.message });
    }
  }

  async stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Stop all cron jobs
    for (const [_productId, cronJob] of this.cronJobs) {
      cronJob.destroy();
    }
    this.cronJobs.clear();

    // Save final state
    await this.saveMonitoringData();

    logger.monitorEvent('monitoring_stopped', {
      productCount: this.monitoredProducts.size,
      totalAlerts: this.alerts.length
    });
  }

  getMonitoringStats() {
    const products = Array.from(this.monitoredProducts.values());

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status !== 'error').length,
      totalAlerts: this.alerts.length,
      recentAlerts: this.alerts.filter(a => Date.now() - a.timestamp < 24 * 60 * 60 * 1000).length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        lastCheck: p.lastCheck,
        stockHistory: p.stockHistory.slice(-5)
      }))
    };
  }
}

export default InventoryMonitor;