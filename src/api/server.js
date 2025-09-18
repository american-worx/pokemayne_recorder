import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import services
// import BrowserManager from '../core/browser-manager.js';
import StealthyRecorder from '../recorder/stealthy-recorder.js';
import InventoryMonitor from '../monitor/inventory-monitor.js';
// import WalmartModule from '../modules/walmart-module.js';
import logger from '../core/utils/logger.js';

class PokemayneAPI {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIO(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.port = process.env.PORT || 3001;
    this.activeRecordings = new Map();
    this.activeMonitors = new Map();
    this.activeAutomations = new Map();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files from UI build
    this.app.use(express.static(path.join(__dirname, '../../ui/build')));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });

    // Stats endpoint
    this.app.get('/api/stats', (req, res) => {
      res.json({
        activeRecordings: this.activeRecordings.size,
        activeMonitors: this.activeMonitors.size,
        totalAutomations: this.activeAutomations.size,
        successRate: 94 // Mock data
      });
    });

    // Recording endpoints
    this.setupRecordingRoutes();

    // Monitor endpoints
    this.setupMonitorRoutes();

    // Automation endpoints
    this.setupAutomationRoutes();

    // Analytics endpoints
    this.setupAnalyticsRoutes();

    // Settings endpoints
    this.setupSettingsRoutes();

    // Serve React app for all other routes
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../ui/build/index.html'));
    });

    // Error handling
    this.app.use((error, req, res, _next) => {
      logger.error('API Error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  setupRecordingRoutes() {
    // Start recording
    this.app.post('/api/recording/start', async (req, res) => {
      try {
        const { url, sessionId } = req.body;

        if (!url) {
          return res.status(400).json({ error: 'URL is required' });
        }

        const recorder = new StealthyRecorder({
          sessionId: sessionId || `session_${Date.now()}`,
          outputDir: 'recordings'
        });

        const _session = await recorder.startRecording(url);
        this.activeRecordings.set(recorder.options.sessionId, recorder);

        // Emit to WebSocket clients
        this.io.emit('recording_started', {
          sessionId: recorder.options.sessionId,
          url
        });

        res.json({
          success: true,
          session: {
            id: recorder.options.sessionId,
            url,
            startTime: Date.now()
          }
        });

      } catch (error) {
        logger.error('Failed to start recording:', error);
        res.status(500).json({
          error: 'Failed to start recording',
          message: error.message
        });
      }
    });

    // Stop recording
    this.app.post('/api/recording/stop/:sessionId', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const recorder = this.activeRecordings.get(sessionId);

        if (!recorder) {
          return res.status(404).json({ error: 'Recording session not found' });
        }

        const result = await recorder.stopRecording();
        this.activeRecordings.delete(sessionId);

        // Emit to WebSocket clients
        this.io.emit('recording_stopped', {
          sessionId,
          result
        });

        res.json(result);

      } catch (error) {
        logger.error('Failed to stop recording:', error);
        res.status(500).json({
          error: 'Failed to stop recording',
          message: error.message
        });
      }
    });

    // Get recording sessions
    this.app.get('/api/recording/sessions', async (req, res) => {
      try {
        // Mock data for now
        const sessions = [
          {
            id: 'session_1234567890',
            url: 'https://www.walmart.com/ip/pokemon-cards/123',
            timestamp: Date.now() - 3600000,
            duration: 45000,
            stats: {
              actions: 15,
              requests: 42,
              captchas: 1,
              errors: 0
            }
          },
          {
            id: 'session_0987654321',
            url: 'https://www.target.com/p/pokemon-cards/456',
            timestamp: Date.now() - 7200000,
            duration: 38000,
            stats: {
              actions: 12,
              requests: 38,
              captchas: 0,
              errors: 2
            }
          }
        ];

        res.json(sessions);

      } catch (error) {
        logger.error('Failed to get recording sessions:', error);
        res.status(500).json({
          error: 'Failed to get recording sessions',
          message: error.message
        });
      }
    });

    // Get recording data
    this.app.get('/api/recording/data/:sessionId', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const recorder = this.activeRecordings.get(sessionId);

        if (!recorder) {
          return res.json({
            actions: [],
            networkRequests: [],
            captchas: [],
            performance: []
          });
        }

        res.json(recorder.recordingData);

      } catch (error) {
        logger.error('Failed to get recording data:', error);
        res.status(500).json({
          error: 'Failed to get recording data',
          message: error.message
        });
      }
    });
  }

  setupMonitorRoutes() {
    // Get monitors
    this.app.get('/api/monitor/products', async (req, res) => {
      try {
        // Mock data
        const monitors = [
          {
            id: 'monitor_1',
            name: 'Pokemon Battle Academy',
            url: 'https://www.walmart.com/ip/pokemon-battle-academy/573850405',
            site: 'walmart',
            status: 'in_stock',
            price: 19.88,
            lastCheck: Date.now() - 30000,
            checkInterval: 30,
            successRate: 98
          },
          {
            id: 'monitor_2',
            name: 'Pokemon Trainer Box',
            url: 'https://www.walmart.com/ip/pokemon-trainer-box/123456789',
            site: 'walmart',
            status: 'out_of_stock',
            price: null,
            lastCheck: Date.now() - 45000,
            checkInterval: 30,
            successRate: 95
          }
        ];

        res.json(monitors);

      } catch (error) {
        logger.error('Failed to get monitors:', error);
        res.status(500).json({
          error: 'Failed to get monitors',
          message: error.message
        });
      }
    });

    // Add monitor
    this.app.post('/api/monitor/products', async (req, res) => {
      try {
        const monitorData = req.body;

        // Create monitor instance
        const monitor = new InventoryMonitor();
        const productId = await monitor.addProduct(monitorData);

        this.activeMonitors.set(productId, monitor);

        // Emit to WebSocket clients
        this.io.emit('monitor_added', {
          productId,
          monitorData
        });

        res.json({
          success: true,
          productId
        });

      } catch (error) {
        logger.error('Failed to add monitor:', error);
        res.status(500).json({
          error: 'Failed to add monitor',
          message: error.message
        });
      }
    });

    // Start monitoring
    this.app.post('/api/monitor/start', async (req, res) => {
      try {
        for (const [_productId, monitor] of this.activeMonitors) {
          await monitor.startMonitoring();
        }

        // Emit to WebSocket clients
        this.io.emit('monitoring_started');

        res.json({ success: true });

      } catch (error) {
        logger.error('Failed to start monitoring:', error);
        res.status(500).json({
          error: 'Failed to start monitoring',
          message: error.message
        });
      }
    });

    // Get stock alerts
    this.app.get('/api/monitor/alerts', async (req, res) => {
      try {
        // Mock data
        const alerts = [
          {
            id: 'alert_1',
            type: 'stock_available',
            productName: 'Pokemon Battle Academy',
            timestamp: Date.now() - 120000,
            price: 19.88
          },
          {
            id: 'alert_2',
            type: 'price_drop',
            productName: 'Pokemon Trainer Box',
            timestamp: Date.now() - 300000,
            price: 45.99
          }
        ];

        res.json(alerts);

      } catch (error) {
        logger.error('Failed to get stock alerts:', error);
        res.status(500).json({
          error: 'Failed to get stock alerts',
          message: error.message
        });
      }
    });
  }

  setupAutomationRoutes() {
    // Get automations
    this.app.get('/api/automation/configs', async (req, res) => {
      try {
        // Mock data
        const automations = [
          {
            id: 'auto_1',
            name: 'Pokemon Walmart Auto',
            site: 'walmart',
            productUrl: 'https://www.walmart.com/ip/pokemon-cards/123',
            status: 'ready',
            created: Date.now() - 86400000,
            lastRun: Date.now() - 3600000,
            successRate: 92
          },
          {
            id: 'auto_2',
            name: 'Target Pokemon Auto',
            site: 'target',
            productUrl: 'https://www.target.com/p/pokemon-cards/456',
            status: 'ready',
            created: Date.now() - 172800000,
            lastRun: null,
            successRate: 0
          }
        ];

        res.json(automations);

      } catch (error) {
        logger.error('Failed to get automations:', error);
        res.status(500).json({
          error: 'Failed to get automations',
          message: error.message
        });
      }
    });

    // Run automation
    this.app.post('/api/automation/run/:automationId', async (req, res) => {
      try {
        const { automationId } = req.params;

        // Simulate automation execution
        setTimeout(() => {
          const success = Math.random() > 0.1; // 90% success rate

          if (success) {
            this.io.emit('automation_completed', {
              automationId,
              success: true,
              orderNumber: `WM${Date.now().toString().slice(-8)}`
            });
          } else {
            this.io.emit('automation_failed', {
              automationId,
              error: 'CAPTCHA challenge failed'
            });
          }
        }, 15000 + Math.random() * 20000); // 15-35 seconds

        res.json({
          success: true,
          message: 'Automation started'
        });

      } catch (error) {
        logger.error('Failed to run automation:', error);
        res.status(500).json({
          error: 'Failed to run automation',
          message: error.message
        });
      }
    });

    // Get execution logs
    this.app.get('/api/automation/logs', async (req, res) => {
      try {
        // Mock data
        const logs = [
          {
            id: 'log_1',
            automationName: 'Pokemon Walmart Auto',
            status: 'completed',
            timestamp: Date.now() - 1800000,
            orderNumber: 'WM12345678'
          },
          {
            id: 'log_2',
            automationName: 'Target Pokemon Auto',
            status: 'failed',
            timestamp: Date.now() - 3600000,
            error: 'Out of stock'
          },
          {
            id: 'log_3',
            automationName: 'Pokemon Walmart Auto',
            status: 'completed',
            timestamp: Date.now() - 5400000,
            orderNumber: 'WM87654321'
          }
        ];

        res.json(logs);

      } catch (error) {
        logger.error('Failed to get execution logs:', error);
        res.status(500).json({
          error: 'Failed to get execution logs',
          message: error.message
        });
      }
    });
  }

  setupAnalyticsRoutes() {
    this.app.get('/api/analytics', async (req, res) => {
      try {
        // Mock analytics data
        const analytics = {
          performance: [
            { time: '12:00', success: 95, errors: 5, response: 1200 },
            { time: '12:05', success: 98, errors: 2, response: 1100 },
            { time: '12:10', success: 92, errors: 8, response: 1300 },
            { time: '12:15', success: 97, errors: 3, response: 1050 },
            { time: '12:20', success: 100, errors: 0, response: 950 },
            { time: '12:25', success: 94, errors: 6, response: 1150 }
          ]
        };

        res.json(analytics);

      } catch (error) {
        logger.error('Failed to get analytics:', error);
        res.status(500).json({
          error: 'Failed to get analytics',
          message: error.message
        });
      }
    });
  }

  setupSettingsRoutes() {
    this.app.get('/api/settings', async (req, res) => {
      try {
        // Mock settings
        const settings = {
          stealthLevel: 'ultra',
          defaultTimeout: 60000,
          maxRetries: 3,
          notificationsEnabled: true,
          discordWebhook: ''
        };

        res.json(settings);

      } catch (error) {
        logger.error('Failed to get settings:', error);
        res.status(500).json({
          error: 'Failed to get settings',
          message: error.message
        });
      }
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      socket.on('join_recording', ({ sessionId }) => {
        socket.join(`recording_${sessionId}`);
        logger.info(`Client ${socket.id} joined recording room: ${sessionId}`);
      });

      socket.on('leave_recording', ({ sessionId }) => {
        socket.leave(`recording_${sessionId}`);
        logger.info(`Client ${socket.id} left recording room: ${sessionId}`);
      });

      socket.on('join_monitor', () => {
        socket.join('monitor');
        logger.info(`Client ${socket.id} joined monitor room`);
      });

      socket.on('join_automation', ({ automationId }) => {
        socket.join(`automation_${automationId}`);
        logger.info(`Client ${socket.id} joined automation room: ${automationId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    // Periodic stats broadcast
    setInterval(() => {
      this.io.emit('stats_update', {
        activeRecordings: this.activeRecordings.size,
        activeMonitors: this.activeMonitors.size,
        totalAutomations: this.activeAutomations.size,
        successRate: 94
      });
    }, 5000);
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(`🚀 Pokemayne Recorder API started on port ${this.port}`);
      logger.info(`📱 UI available at http://localhost:${this.port}`);
      logger.info('🔌 WebSocket server running');
    });
  }
}

// Start the server
const api = new PokemayneAPI();
api.start();

export default PokemayneAPI;