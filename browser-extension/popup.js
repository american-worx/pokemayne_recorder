// Pokemayne Recorder - Popup Interface
// Controls recording and shows connection status

class PopupController {
  constructor() {
    this.port = null;
    this.status = {
      isConnected: false,
      isRecording: false,
      sessionId: null
    };

    this.elements = {
      loading: document.getElementById('loading'),
      mainPanel: document.getElementById('main-panel'),
      connectionLight: document.getElementById('connection-light'),
      connectionText: document.getElementById('connection-text'),
      recordingLight: document.getElementById('recording-light'),
      recordingText: document.getElementById('recording-text'),
      startBtn: document.getElementById('start-btn'),
      stopBtn: document.getElementById('stop-btn'),
      sessionInfo: document.getElementById('session-info'),
      sessionId: document.getElementById('session-id'),
      errorMessage: document.getElementById('error-message')
    };

    this.initializePopup();
  }

  initializePopup() {
    // Connect to background script
    this.connectToBackground();

    // Set up event listeners
    this.setupEventListeners();

    // Request initial status
    this.requestStatus();

    console.log('🎯 Pokemayne popup initialized');
  }

  connectToBackground() {
    this.port = chrome.runtime.connect({ name: 'popup' });

    this.port.onMessage.addListener((message) => {
      this.handleBackgroundMessage(message);
    });

    this.port.onDisconnect.addListener(() => {
      console.log('❌ Disconnected from background');
      this.showError('Extension disconnected');
    });
  }

  setupEventListeners() {
    this.elements.startBtn.addEventListener('click', () => {
      this.startRecording();
    });

    this.elements.stopBtn.addEventListener('click', () => {
      this.stopRecording();
    });

    // Auto-refresh status every 2 seconds
    setInterval(() => {
      this.requestStatus();
    }, 2000);
  }

  handleBackgroundMessage(message) {
    if (message.isConnected !== undefined) {
      this.updateStatus({
        isConnected: message.isConnected,
        isRecording: message.isRecording,
        sessionId: message.sessionId
      });
    }
  }

  requestStatus() {
    if (this.port) {
      this.port.postMessage({ type: 'get_status' });
    }
  }

  startRecording() {
    if (!this.status.isConnected) {
      this.showError('Not connected to UI. Please ensure the Pokemayne UI is running.');
      return;
    }

    if (this.status.isRecording) {
      this.showError('Recording is already in progress.');
      return;
    }

    this.port.postMessage({ type: 'start_recording' });
    this.elements.startBtn.disabled = true;
    this.hideError();
  }

  stopRecording() {
    if (!this.status.isRecording) {
      this.showError('No recording in progress.');
      return;
    }

    this.port.postMessage({ type: 'stop_recording' });
    this.elements.stopBtn.disabled = true;
    this.hideError();
  }

  updateStatus(newStatus) {
    this.status = { ...this.status, ...newStatus };

    // Hide loading and show main panel
    this.elements.loading.style.display = 'none';
    this.elements.mainPanel.style.display = 'block';

    // Update connection status
    if (this.status.isConnected) {
      this.elements.connectionLight.className = 'indicator-light connected';
      this.elements.connectionText.textContent = 'Connected';
    } else {
      this.elements.connectionLight.className = 'indicator-light disconnected';
      this.elements.connectionText.textContent = 'Disconnected';
    }

    // Update recording status
    if (this.status.isRecording) {
      this.elements.recordingLight.className = 'indicator-light recording';
      this.elements.recordingText.textContent = 'Recording';
    } else {
      this.elements.recordingLight.className = 'indicator-light idle';
      this.elements.recordingText.textContent = 'Idle';
    }

    // Update buttons
    this.elements.startBtn.disabled = !this.status.isConnected || this.status.isRecording;
    this.elements.stopBtn.disabled = !this.status.isRecording;

    // Update session info
    if (this.status.isRecording && this.status.sessionId) {
      this.elements.sessionInfo.style.display = 'block';
      this.elements.sessionId.textContent = this.status.sessionId;
    } else {
      this.elements.sessionInfo.style.display = 'none';
    }

    // Show connection error if disconnected
    if (!this.status.isConnected) {
      this.showError('Disconnected from UI. Please ensure the Pokemayne UI is running on localhost:3001');
    } else {
      this.hideError();
    }
  }

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.style.display = 'block';
  }

  hideError() {
    this.elements.errorMessage.style.display = 'none';
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});