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
    this.uiPort = 3001;
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
        this.socket = io(`http://localhost:${this.uiPort}`, {
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
    this.websocket = new WebSocket(`ws://localhost:${this.uiPort}/socket.io/?EIO=4&transport=websocket`);

    this.websocket.onopen = () => {
      console.log('🚀 Connected to Pokemayne UI (WebSocket fallback)');
      this.isConnected = true;
      this.updateBadge();
      this.startHeartbeat();

      // Send extension connection signal
      this.websocket.send(JSON.stringify({
        type: 'extension_connect',
        data: {
          extensionId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version
        }
      }));
    };

    this.websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleUIMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.websocket.onclose = () => {
      console.log('❌ Disconnected from Pokemayne UI');
      this.isConnected = false;
      this.updateBadge();
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
      this.updateBadge();
    };
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
    if (!this.isConnected) {
      console.error('❌ Cannot start recording: Not connected to UI');
      return;
    }

    if (this.isRecording) {
      console.warn('⚠️ Recording already in progress');
      return;
    }

    // Signal server to start recording
    this.socket.emit('extension_start_recording', {
      config
    });

    console.log('🎬 Recording start requested');
  }

  async stopRecording() {
    if (!this.isRecording) {
      console.warn('⚠️ No recording in progress');
      return;
    }

    // Signal server to stop recording
    this.socket.emit('extension_stop_recording');

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

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type.startsWith('record_')) {
    recorder.handleContentScriptMessage(message, sender);
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