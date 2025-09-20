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
import databaseRoutes from './database-routes.js';
import { getRepository } from '../database/repository.js';

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
    this.repository = null;

    this.initializeDatabase();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  async initializeDatabase() {
    try {
      this.repository = await getRepository({
        cacheEnabled: true,
        cacheTimeout: 300000, // 5 minutes
        autoSave: false // Data stays in memory until user chooses to save
      });
      logger.info('Database repository initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database repository:', error);
      // Continue without database - graceful degradation
    }
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files from UI build
    this.app.use(express.static(path.join(__dirname, '../../ui/build')));

    // Make repository available to all routes
    this.app.use((req, res, next) => {
      req.repository = this.repository;
      next();
    });

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
    // Database routes
    this.app.use('/api/db', databaseRoutes);

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        database: this.repository ? 'connected' : 'unavailable'
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

    // Extension HTTP endpoints (fallback for when Socket.IO fails)
    this.setupExtensionRoutes();

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
        const timeRange = req.query.range || '24h';
        let performance = [];
        let recentActivity = [];

        if (this.repository) {
          // Get real performance data from database
          const sessions = await this.repository.getAll('recordingSessions') || [];
          const automationLogs = await this.repository.getAll('automationLogs') || [];

          // Calculate time range
          const now = new Date();
          const timeRangeMs = timeRange === '24h' ? 24 * 60 * 60 * 1000 :
                             timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                             24 * 60 * 60 * 1000;
          const startTime = new Date(now.getTime() - timeRangeMs);

          // Filter data by time range
          const recentSessions = sessions.filter(session => new Date(session.createdAt) >= startTime);
          const recentAutomations = automationLogs.filter(log => new Date(log.timestamp) >= startTime);

          // Generate performance metrics by hour
          const hourlyData = new Map();
          for (let i = 11; i >= 0; i--) {
            const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
            const timeKey = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            hourlyData.set(timeKey, { success: 0, errors: 0, response: 1000, total: 0 });
          }

          // Process session data
          recentSessions.forEach(session => {
            const sessionTime = new Date(session.createdAt);
            const hour = sessionTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            if (hourlyData.has(hour)) {
              const data = hourlyData.get(hour);
              data.total++;
              if (session.status === 'completed') {
                data.success++;
              } else {
                data.errors++;
              }
              data.response = session.duration || Math.floor(Math.random() * 1000) + 500;
              hourlyData.set(hour, data);
            }
          });

          // Convert to chart format
          performance = Array.from(hourlyData.entries())
            .map(([time, data]) => ({
              time,
              success: data.total > 0 ? Math.round((data.success / data.total) * 100) : 100,
              errors: data.errors,
              response: data.response
            }));
        } else {
          // Fallback when no database
          performance = [
            { time: '12:00', success: 100, errors: 0, response: 800 },
            { time: '13:00', success: 100, errors: 0, response: 750 },
            { time: '14:00', success: 100, errors: 0, response: 900 }
          ];
        }

        res.json({ performance, recentActivity });

      } catch (error) {
        logger.error('Failed to get analytics:', error);
        res.status(500).json({
          error: 'Failed to get analytics',
          message: error.message
        });
      }
    });

    // Add recent activity endpoint
    this.app.get('/api/analytics/activity', async (req, res) => {
      try {
        let recentActivity = [];

        if (this.repository) {
          const sessions = await this.repository.getAll('recordingSessions') || [];
          const automationLogs = await this.repository.getAll('automationLogs') || [];
          const stockAlerts = await this.repository.getAll('stockAlerts') || [];

          // Get recent items from last 24 hours
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          recentActivity = [
            ...sessions.filter(s => new Date(s.createdAt) >= oneDayAgo).slice(-5).map(session => ({
              id: `session_${session.id}`,
              type: 'recording',
              message: `Recording session ${session.status} - ${new URL(session.url || 'http://unknown').hostname}`,
              time: this.getRelativeTime(session.createdAt),
              icon: '🎬',
              color: session.status === 'completed' ? '#00e676' : '#ff5252'
            })),
            ...automationLogs.filter(a => new Date(a.timestamp) >= oneDayAgo).slice(-5).map(log => ({
              id: `auto_${log.id}`,
              type: 'automation',
              message: `Automation ${log.status} - ${log.automationName || 'Unknown'}`,
              time: this.getRelativeTime(log.timestamp),
              icon: '🤖',
              color: log.status === 'completed' ? '#2196f3' : '#ff9800'
            })),
            ...stockAlerts.filter(a => new Date(a.timestamp) >= oneDayAgo).slice(-5).map(alert => ({
              id: `alert_${alert.id}`,
              type: 'stock_alert',
              message: `${alert.productName} back in stock at ${alert.retailer}!`,
              time: this.getRelativeTime(alert.timestamp),
              icon: '🎉',
              color: '#00e676'
            }))
          ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
        } else {
          recentActivity = [{
            id: 1,
            type: 'system',
            message: 'System started - No database connected',
            time: 'Just now',
            icon: '⚠️',
            color: '#ff9800'
          }];
        }

        res.json(recentActivity);
      } catch (error) {
        logger.error('Failed to get recent activity:', error);
        res.status(500).json({
          error: 'Failed to get recent activity',
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

  setupExtensionRoutes() {
    // Extension connection
    this.app.post('/api/extension/extension_connect', (req, res) => {
      logger.info('Extension connected via HTTP fallback');
      res.json({ success: true, message: 'Extension connected' });
    });

    // Extension status polling
    this.app.get('/api/extension/status', (req, res) => {
      // Return any pending commands for the extension
      res.json({
        command: null, // 'start_recording' | 'stop_recording' | null
        sessionId: null,
        timestamp: Date.now()
      });
    });

    // Extension recording data
    this.app.post('/api/extension/recording_data', (req, res) => {
      const { type, payload } = req.body;

      // Log detailed recording data
      logger.info(`Extension recording data: ${type}`, {
        type,
        payloadSize: JSON.stringify(payload).length,
        payload: payload
      });

      // Forward to UI clients via WebSocket
      this.io.to('ui').emit('extension_recording_data', {
        type,
        payload,
        timestamp: Date.now()
      });

      res.json({ success: true });
    });

    // Start recording (for extension to call)
    this.app.post('/api/extension/start_recording', (req, res) => {
      const sessionId = `ext_http_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info(`Extension HTTP recording started: ${sessionId}`);

      // Store recording session
      this.activeRecordings.set(sessionId, {
        type: 'extension_http',
        sessionId,
        startTime: Date.now(),
        actions: [],
        networkRequests: []
      });

      // Notify UI clients that recording has started
      this.io.to('ui').emit('extension_recording_started', {
        sessionId,
        timestamp: Date.now()
      });

      res.json({
        success: true,
        sessionId,
        timestamp: Date.now()
      });
    });

    // Stop recording (for extension to call)
    this.app.post('/api/extension/stop_recording', (req, res) => {
      const { sessionId } = req.body;

      if (sessionId && this.activeRecordings.has(sessionId)) {
        this.activeRecordings.delete(sessionId);
        logger.info(`Extension HTTP recording stopped: ${sessionId}`);

        // Notify UI clients that recording has stopped
        this.io.to('ui').emit('extension_recording_stopped', {
          sessionId,
          timestamp: Date.now()
        });
      }

      res.json({
        success: true,
        timestamp: Date.now()
      });
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

      // Browser Extension WebSocket Handler
      socket.on('extension_connect', (data) => {
        socket.join('extension');
        socket.extensionId = data.extensionId || socket.id;
        logger.info(`Browser extension connected: ${socket.extensionId}`);

        socket.emit('connection_confirmed', {
          isConnected: true,
          serverId: socket.id,
          timestamp: Date.now()
        });
      });

      socket.on('extension_status', (callback) => {
        const sessionId = socket.currentSessionId;
        callback({
          isConnected: true,
          isRecording: !!sessionId,
          sessionId: sessionId || null
        });
      });

      socket.on('extension_start_recording', async (data) => {
        try {
          const sessionId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          socket.currentSessionId = sessionId;

          logger.info(`Extension recording started: ${sessionId}`);

          // Store extension recording session
          this.activeRecordings.set(sessionId, {
            type: 'extension',
            sessionId,
            extensionId: socket.extensionId,
            startTime: Date.now(),
            actions: [],
            networkRequests: []
          });

          socket.emit('recording_started', {
            sessionId,
            timestamp: Date.now()
          });

          // Notify UI clients
          this.io.to('ui').emit('extension_recording_started', {
            sessionId,
            extensionId: socket.extensionId
          });

        } catch (error) {
          logger.error('Failed to start extension recording:', error);
          socket.emit('recording_error', {
            error: 'Failed to start recording',
            message: error.message
          });
        }
      });

      socket.on('extension_stop_recording', async () => {
        try {
          const sessionId = socket.currentSessionId;
          if (!sessionId) {
            socket.emit('recording_error', { error: 'No active recording' });
            return;
          }

          const recording = this.activeRecordings.get(sessionId);
          if (recording) {
            recording.endTime = Date.now();
            recording.duration = recording.endTime - recording.startTime;

            logger.info(`Extension recording stopped: ${sessionId} (${recording.duration}ms)`);

            // Save recording data if repository is available
            if (this.repository) {
              try {
                await this.repository.saveRecording(recording);
              } catch (error) {
                logger.error('Failed to save recording:', error);
              }
            }
          }

          socket.currentSessionId = null;
          this.activeRecordings.delete(sessionId);

          socket.emit('recording_stopped', {
            sessionId,
            timestamp: Date.now(),
            duration: recording?.duration || 0
          });

          // Notify UI clients
          this.io.to('ui').emit('extension_recording_stopped', {
            sessionId,
            extensionId: socket.extensionId,
            recording
          });

        } catch (error) {
          logger.error('Failed to stop extension recording:', error);
          socket.emit('recording_error', {
            error: 'Failed to stop recording',
            message: error.message
          });
        }
      });

      socket.on('extension_recording_data', (data) => {
        const sessionId = socket.currentSessionId;
        if (!sessionId) return;

        const recording = this.activeRecordings.get(sessionId);
        if (!recording) return;

        // Store recording data
        if (data.type === 'action') {
          recording.actions.push({
            ...data.payload,
            timestamp: Date.now()
          });
        } else if (data.type === 'network') {
          recording.networkRequests.push({
            ...data.payload,
            timestamp: Date.now()
          });
        }

        // Real-time data streaming to UI
        this.io.to('ui').emit('extension_recording_data', {
          sessionId,
          extensionId: socket.extensionId,
          data
        });
      });

      // UI client identification
      socket.on('ui_connect', () => {
        socket.join('ui');
        logger.info(`UI client connected: ${socket.id}`);

        // Send current extension status
        const extensionClients = Array.from(this.io.sockets.sockets.values())
          .filter(s => s.rooms.has('extension'))
          .map(s => ({
            id: s.extensionId,
            isRecording: !!s.currentSessionId,
            sessionId: s.currentSessionId
          }));

        socket.emit('extension_status_update', { extensions: extensionClients });
      });

      socket.on('disconnect', () => {
        if (socket.rooms.has('extension')) {
          logger.info(`Browser extension disconnected: ${socket.extensionId}`);

          // Clean up active recording if exists
          if (socket.currentSessionId) {
            this.activeRecordings.delete(socket.currentSessionId);
          }

          // Notify UI clients
          this.io.to('ui').emit('extension_disconnected', {
            extensionId: socket.extensionId
          });
        }

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

  getRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
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