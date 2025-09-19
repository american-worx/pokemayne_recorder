// Pokemayne Recorder - Background Service Worker
// Maintains connection to UI and coordinates recording

// Socket.IO client for service worker
let io = null;

// Load Socket.IO client dynamically
async function loadSocketIO() {
  try {
    // Try to load Socket.IO from the bundled file
    const script = await fetch(chrome.runtime.getURL('socket.io.min.js'));
    const scriptText = await script.text();
    eval(scriptText);
    return self.io;
  } catch (error) {
    console.warn('Failed to load Socket.IO, falling back to WebSocket:', error);
    return null;
  }
}

class PokemayneRecorder {
  constructor() {
    this.isConnected = false;
    this.isRecording = false;
    this.sessionId = null;
    this.socket = null;
    this.websocket = null;
    this.reconnectInterval = null;
    this.heartbeatInterval = null;
    this.serverHost = 'localhost'; // Default host
    this.serverPort = 3001; // Default port
    this.recordingData = {
      actions: [],
      network: [],
      console: [],
      dom: []
    };

    this.initializeExtension();
  }

  async initializeExtension() {
    // Load Socket.IO client
    io = await loadSocketIO();

    // Load server configuration
    await this.loadServerConfig();

    // Restore state from storage
    await this.restoreState();

    // Connect to UI
    this.connectToUI();

    // Set up tab listeners for navigation persistence
    this.setupNavigationListeners();

    // Update badge
    this.updateBadge();

    console.log('🎯 Pokemayne Recorder initialized');
  }

  async loadServerConfig() {
    try {
      const result = await chrome.storage.local.get(['serverUrl']);
      if (result.serverUrl) {
        const url = new URL(result.serverUrl);
        this.serverHost = url.hostname;
        this.serverPort = url.port || (url.protocol === 'https:' ? 443 : 80);
      }
      console.log(`🔗 Server config: ${this.serverHost}:${this.serverPort}`);
    } catch (error) {
      console.error('Failed to load server config:', error);
      // Keep defaults
    }
  }

  getServerUrl() {
    return `http://${this.serverHost}:${this.serverPort}`;
  }

  async restoreState() {
    try {
      const result = await chrome.storage.local.get(['isRecording', 'sessionId', 'recordingData']);

      this.isRecording = result.isRecording || false;
      this.sessionId = result.sessionId || null;
      this.recordingData = result.recordingData || {
        actions: [],
        network: [],
        console: [],
        dom: []
      };

      console.log('🔄 State restored:', {
        isRecording: this.isRecording,
        sessionId: this.sessionId,
        actionsCount: this.recordingData.actions.length
      });
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({
        isRecording: this.isRecording,
        sessionId: this.sessionId,
        recordingData: this.recordingData
      });
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  connectToUI() {
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.websocket) {
      this.websocket.close();
    }

    try {
      if (io) {
        // Use Socket.IO client
        this.socket = io(this.getServerUrl(), {
          transports: ['websocket']
        });
        this.setupSocketIOHandlers();
      } else {
        // Fallback to plain WebSocket
        this.setupWebSocketConnection();
      }
    } catch (error) {
      console.error('Failed to connect to UI:', error);
      this.isConnected = false;
      this.updateBadge();
      this.scheduleReconnect();
    }
  }

  setupSocketIOHandlers() {

      this.socket.on('connect', () => {
        console.log('🚀 Connected to Pokemayne UI');
        this.isConnected = true;
        this.updateBadge();
        this.startHeartbeat();

        // Send extension connection signal
        this.socket.emit('extension_connect', {
          extensionId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version
        });
      });

      this.socket.on('connection_confirmed', (data) => {
        console.log('✅ Connection confirmed by UI server');

        // Send current state to UI
        this.socket.emit('extension_recording_data', {
          type: 'status',
          payload: {
            isRecording: this.isRecording,
            sessionId: this.sessionId,
            recordingStats: {
              actions: this.recordingData.actions.length,
              network: this.recordingData.network.length,
              console: this.recordingData.console.length
            }
          }
        });
      });

      this.socket.on('recording_started', async (data) => {
        console.log('📡 Recording started by UI:', data);
        this.sessionId = data.sessionId;
        this.isRecording = true;
        this.recordingData = {
          actions: [],
          network: [],
          console: [],
          dom: []
        };

        await this.saveState();
        this.updateBadge();

        // Notify all content scripts to start recording
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'start_recording',
              sessionId: this.sessionId
            });
          } catch (error) {
            console.debug(`Could not notify tab ${tab.id}:`, error.message);
          }
        }
      });

      this.socket.on('recording_stopped', async (data) => {
        console.log('📡 Recording stopped by UI:', data);

        this.isRecording = false;
        this.sessionId = null;

        await this.saveState();
        this.updateBadge();

        // Notify all content scripts to stop recording
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, { type: 'stop_recording' });
          } catch (error) {
            console.debug(`Could not notify tab ${tab.id}:`, error.message);
          }
        }
      });

      this.socket.on('recording_error', (data) => {
        console.error('❌ Recording error from UI:', data);
        this.isRecording = false;
        this.sessionId = null;
        this.saveState();
        this.updateBadge();
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from Pokemayne UI');
        this.isConnected = false;
        this.updateBadge();
        this.stopHeartbeat();
        this.scheduleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.updateBadge();
      });
  }

  setupWebSocketConnection() {
    // For now, just use HTTP polling as fallback
    console.log('🔄 Socket.IO not available, using HTTP polling fallback');
    this.setupHTTPPolling();
  }

  setupHTTPPolling() {
    // Simple HTTP-based communication fallback
    console.log('🔄 Setting up HTTP polling to:', this.getServerUrl());
    this.isConnected = true;
    this.updateBadge();

    // Send initial connection
    this.sendHTTPMessage('extension_connect', {
      extensionId: chrome.runtime.id,
      version: chrome.runtime.getManifest().version
    });

    // Start polling for status
    this.startStatusPolling();
  }

  async sendHTTPMessage(type, data) {
    try {
      const response = await fetch(`${this.getServerUrl()}/api/extension/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.warn(`HTTP message failed: ${response.status}`);
      }
    } catch (error) {
      console.error('HTTP message failed:', error);
      this.isConnected = false;
      this.updateBadge();
    }
  }

  async sendHTTPStartRecording(config) {
    try {
      const response = await fetch(`${this.getServerUrl()}/api/extension/start_recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📡 Recording started via HTTP:', result);

        // Start recording locally (similar to Socket.IO flow)
        this.sessionId = result.sessionId;
        this.isRecording = true;
        this.recordingData = {
          actions: [],
          network: [],
          console: [],
          dom: []
        };

        await this.saveState();
        this.updateBadge();

        // Notify all content scripts to start recording
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'start_recording',
              sessionId: this.sessionId
            });
          } catch (error) {
            console.debug(`Could not notify tab ${tab.id}:`, error.message);
          }
        }
      } else {
        console.error('HTTP start recording failed:', response.status);
      }
    } catch (error) {
      console.error('HTTP start recording failed:', error);
      this.isConnected = false;
      this.updateBadge();
    }
  }

  async sendHTTPStopRecording() {
    try {
      const response = await fetch(`${this.getServerUrl()}/api/extension/stop_recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📡 Recording stopped via HTTP:', result);

        // Stop recording locally (similar to Socket.IO flow)
        this.isRecording = false;
        this.sessionId = null;

        await this.saveState();
        this.updateBadge();

        // Notify all content scripts to stop recording
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, { type: 'stop_recording' });
          } catch (error) {
            console.debug(`Could not notify tab ${tab.id}:`, error.message);
          }
        }
      } else {
        console.error('HTTP stop recording failed:', response.status);
      }
    } catch (error) {
      console.error('HTTP stop recording failed:', error);
      this.isConnected = false;
      this.updateBadge();
    }
  }

  startStatusPolling() {
    // Poll every 5 seconds for status updates
    this.statusInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.getServerUrl()}/api/extension/status`);
        if (response.ok) {
          const status = await response.json();
          if (status.command === 'start_recording' && !this.isRecording) {
            await this.handleRecordingStart(status.sessionId);
          } else if (status.command === 'stop_recording' && this.isRecording) {
            await this.handleRecordingStop();
          }
        } else {
          console.warn(`Status polling failed: ${response.status} ${response.statusText}`);
          if (response.status === 404) {
            console.log('API server may not be running or accessible');
            this.isConnected = false;
            this.updateBadge();
          }
        }
      } catch (error) {
        console.error('Status polling failed:', error);
        this.isConnected = false;
        this.updateBadge();

        // Stop polling if we can't connect
        if (this.statusInterval) {
          clearInterval(this.statusInterval);
          this.statusInterval = null;
        }

        // Try to reconnect after a delay
        this.scheduleReconnect();
      }
    }, 5000);
  }

  async handleRecordingStart(sessionId) {
    this.sessionId = sessionId;
    this.isRecording = true;
    this.recordingData = {
      actions: [],
      network: [],
      console: [],
      dom: []
    };

    await this.saveState();
    this.updateBadge();

    // Notify all content scripts to start recording
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'start_recording',
          sessionId: this.sessionId
        });
      } catch (error) {
        console.debug(`Could not notify tab ${tab.id}:`, error.message);
      }
    }

    console.log('🎬 Recording started:', sessionId);
  }

  async handleRecordingStop() {
    this.isRecording = false;
    this.sessionId = null;

    await this.saveState();
    this.updateBadge();

    // Notify all content scripts to stop recording
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'stop_recording' });
      } catch (error) {
        console.debug(`Could not notify tab ${tab.id}:`, error.message);
      }
    }

    console.log('🛑 Recording stopped');
  }

  scheduleReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected) {
        console.log('🔄 Attempting to reconnect to UI...');
        this.connectToUI();
      }
    }, 5000); // Retry every 5 seconds
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket.connected) {
        this.socket.emit('extension_recording_data', {
          type: 'heartbeat',
          payload: { timestamp: Date.now() }
        });
      }
    }, 30000); // Heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendToUI(message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('extension_recording_data', {
        type: message.type,
        payload: message.data || message
      });
    } else if (this.isConnected) {
      // HTTP fallback
      this.sendHTTPMessage('recording_data', {
        type: message.type,
        payload: message.data || message
      });
    }
  }

  async handleUIMessage(message) {
    console.log('📨 Message from UI:', message.type);

    switch (message.type) {
      case 'start_recording':
        await this.startRecording(message.data);
        break;
      case 'stop_recording':
        await this.stopRecording();
        break;
      case 'get_status':
        this.sendStatus();
        break;
      case 'ping':
        this.socket.emit('extension_recording_data', {
          type: 'pong',
          payload: { timestamp: Date.now() }
        });
        break;
    }
  }

  async startRecording(config = {}) {
    console.log('🎬 Start recording called, isConnected:', this.isConnected, 'socket:', !!this.socket);
    if (!this.isConnected) {
      console.error('❌ Cannot start recording: Not connected to UI');
      return;
    }

    if (this.isRecording) {
      console.warn('⚠️ Recording already in progress');
      return;
    }

    // Signal server to start recording
    if (this.socket && this.socket.connected) {
      this.socket.emit('extension_start_recording', {
        config
      });
    } else if (this.isConnected) {
      // HTTP fallback
      await this.sendHTTPStartRecording(config);
    }

    console.log('🎬 Recording start requested');
  }

  async stopRecording() {
    if (!this.isRecording) {
      console.warn('⚠️ No recording in progress');
      return;
    }

    // Signal server to stop recording
    if (this.socket && this.socket.connected) {
      this.socket.emit('extension_stop_recording');
    } else if (this.isConnected) {
      // HTTP fallback
      await this.sendHTTPStopRecording();
    }

    console.log('🛑 Recording stop requested');
  }

  sendStatus() {
    this.sendToUI({
      type: 'status_update',
      data: {
        isConnected: this.isConnected,
        isRecording: this.isRecording,
        sessionId: this.sessionId,
        recordingStats: {
          actions: this.recordingData.actions.length,
          network: this.recordingData.network.length,
          console: this.recordingData.console.length
        }
      }
    });
  }

  updateBadge() {
    let text = '';
    let color = '#666666';

    if (!this.isConnected) {
      text = '❌';
      color = '#ff4444';
    } else if (this.isRecording) {
      text = '🔴';
      color = '#ff0000';
    } else {
      text = '⚪';
      color = '#00ff00';
    }

    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });
  }

  setupNavigationListeners() {
    // Listen for tab navigation to maintain recording state
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (details.frameId === 0 && this.isRecording) {
        // Main frame navigation during recording
        console.log('🔄 Navigation detected during recording:', details.url);
      }
    });

    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.frameId === 0 && this.isRecording) {
        // Re-inject recording script after navigation
        setTimeout(() => {
          chrome.tabs.sendMessage(details.tabId, {
            type: 'start_recording',
            sessionId: this.sessionId,
            resuming: true
          }).catch(() => {
            // Content script might not be ready yet
          });
        }, 1000);
      }
    });
  }

  // Handle messages from content scripts
  handleContentScriptMessage(message, sender) {
    if (!this.isRecording) return;

    const recordingEntry = {
      ...message.data,
      timestamp: Date.now(),
      tabId: sender.tab.id,
      url: sender.tab.url
    };

    switch (message.type) {
      case 'record_action':
        this.recordingData.actions.push(recordingEntry);
        this.socket.emit('extension_recording_data', {
          type: 'action',
          payload: recordingEntry
        });
        break;

      case 'record_network':
        this.recordingData.network.push(recordingEntry);
        this.socket.emit('extension_recording_data', {
          type: 'network',
          payload: recordingEntry
        });
        break;

      case 'record_console':
        this.recordingData.console.push(recordingEntry);
        this.socket.emit('extension_recording_data', {
          type: 'console',
          payload: recordingEntry
        });
        break;
    }

    // Save state periodically
    this.saveState();
  }
}

// Initialize the recorder
const recorder = new PokemayneRecorder();

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type.startsWith('record_')) {
    recorder.handleContentScriptMessage(message, sender);
  } else if (message.type === 'server_url_changed') {
    // Reload server config and reconnect
    recorder.loadServerConfig().then(() => {
      recorder.connectToUI();
    });
  }

  sendResponse({ received: true });
});

// Handle popup requests
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    port.onMessage.addListener((message) => {
      switch (message.type) {
        case 'get_status':
          port.postMessage({
            isConnected: recorder.isConnected,
            isRecording: recorder.isRecording,
            sessionId: recorder.sessionId
          });
          break;
        case 'start_recording':
          recorder.startRecording();
          break;
        case 'stop_recording':
          recorder.stopRecording();
          break;
      }
    });
  }
});