import io from 'socket.io-client';

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

let socket = null;

export const connectWebSocket = () => {
  if (socket) {
    return socket;
  }

  console.log('🔌 Connecting to WebSocket:', WEBSOCKET_URL);

  socket = io(WEBSOCKET_URL, {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 10
  });

  // Connection events
  socket.on('connect', () => {
    console.log('✅ WebSocket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🚨 WebSocket connection error:', error.message);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_error', (error) => {
    console.error('🚨 WebSocket reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('💔 WebSocket reconnection failed - max attempts reached');
  });

  // Application-specific events
  socket.on('recording_update', (data) => {
    console.log('🎬 Recording update received:', data);
    // Handle recording updates
  });

  socket.on('monitor_update', (data) => {
    console.log('📊 Monitor update received:', data);
    // Handle monitor updates
  });

  socket.on('stock_alert', (data) => {
    console.log('🚨 Stock alert received:', data);
    // Handle stock alerts
  });

  socket.on('automation_update', (data) => {
    console.log('🤖 Automation update received:', data);
    // Handle automation updates
  });

  socket.on('system_notification', (data) => {
    console.log('🔔 System notification received:', data);
    // Handle system notifications
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting WebSocket');
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};

// Event emitters for specific actions
export const websocketEvents = {
  // Recording events
  joinRecordingRoom: (sessionId) => {
    if (socket) {
      socket.emit('join_recording', { sessionId });
    }
  },

  leaveRecordingRoom: (sessionId) => {
    if (socket) {
      socket.emit('leave_recording', { sessionId });
    }
  },

  // Monitor events
  joinMonitorRoom: () => {
    if (socket) {
      socket.emit('join_monitor');
    }
  },

  leaveMonitorRoom: () => {
    if (socket) {
      socket.emit('leave_monitor');
    }
  },

  // Automation events
  joinAutomationRoom: (automationId) => {
    if (socket) {
      socket.emit('join_automation', { automationId });
    }
  },

  leaveAutomationRoom: (automationId) => {
    if (socket) {
      socket.emit('leave_automation', { automationId });
    }
  },

  // Send custom events
  sendEvent: (eventName, data) => {
    if (socket) {
      socket.emit(eventName, data);
    }
  }
};

export default {
  connectWebSocket,
  disconnectWebSocket,
  getSocket,
  websocketEvents
};