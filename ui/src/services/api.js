import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message);

    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('🔐 Unauthorized access detected');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.log('🚨 Server error detected');
    }

    return Promise.reject(error);
  }
);

export const apiService = {
  // General Stats
  async getStats() {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        activeRecordings: 0,
        activeMonitors: 0,
        totalAutomations: 0,
        successRate: 0
      };
    }
  },

  // Recording API
  async startRecording(config) {
    try {
      const response = await api.post('/recording/start', config);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start recording');
    }
  },

  async stopRecording(sessionId) {
    try {
      const response = await api.post(`/recording/stop/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to stop recording');
    }
  },

  async getRecordingSessions() {
    try {
      const response = await api.get('/recording/sessions');
      return response.data;
    } catch (error) {
      console.error('Failed to get recording sessions:', error);
      return [];
    }
  },

  async getRecordingData(sessionId) {
    try {
      const response = await api.get(`/recording/data/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get recording data:', error);
      return { actions: [], networkRequests: [], captchas: [], performance: [] };
    }
  },

  async deleteRecordingSession(sessionId) {
    try {
      await api.delete(`/recording/sessions/${sessionId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete session');
    }
  },

  async downloadRecordingSession(sessionId) {
    try {
      const response = await api.get(`/recording/download/${sessionId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download session');
    }
  },

  // Monitor API
  async getMonitors() {
    try {
      const response = await api.get('/monitor/products');
      return response.data;
    } catch (error) {
      console.error('Failed to get monitors:', error);
      return [];
    }
  },

  async addMonitor(monitorData) {
    try {
      const response = await api.post('/monitor/products', monitorData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add monitor');
    }
  },

  async deleteMonitor(monitorId) {
    try {
      await api.delete(`/monitor/products/${monitorId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete monitor');
    }
  },

  async startMonitoring() {
    try {
      const response = await api.post('/monitor/start');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to start monitoring');
    }
  },

  async stopMonitoring() {
    try {
      const response = await api.post('/monitor/stop');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to stop monitoring');
    }
  },

  async getStockAlerts() {
    try {
      const response = await api.get('/monitor/alerts');
      return response.data;
    } catch (error) {
      console.error('Failed to get stock alerts:', error);
      return [];
    }
  },

  async getRecentStockAlerts() {
    try {
      const response = await api.get('/monitor/alerts/recent');
      return response.data;
    } catch (error) {
      console.error('Failed to get recent stock alerts:', error);
      return [];
    }
  },

  // Automation API
  async getAutomations() {
    try {
      const response = await api.get('/automation/configs');
      return response.data;
    } catch (error) {
      console.error('Failed to get automations:', error);
      return [];
    }
  },

  async createAutomation(automationData) {
    try {
      const response = await api.post('/automation/configs', automationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create automation');
    }
  },

  async runAutomation(automationId) {
    try {
      const response = await api.post(`/automation/run/${automationId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to run automation');
    }
  },

  async stopAutomation(automationId) {
    try {
      const response = await api.post(`/automation/stop/${automationId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to stop automation');
    }
  },

  async deleteAutomation(automationId) {
    try {
      await api.delete(`/automation/configs/${automationId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete automation');
    }
  },

  async getExecutionLogs() {
    try {
      const response = await api.get('/automation/logs');
      return response.data;
    } catch (error) {
      console.error('Failed to get execution logs:', error);
      return [];
    }
  },

  // Analytics API
  async getAnalytics(timeRange = '24h') {
    try {
      const response = await api.get(`/analytics?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        performance: [],
        success: [],
        errors: [],
        speed: []
      };
    }
  },

  async getPerformanceMetrics() {
    try {
      const response = await api.get('/analytics/performance');
      return response.data;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return [];
    }
  },

  // Settings API
  async getSettings() {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {};
    }
  },

  async updateSettings(settings) {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update settings');
    }
  },

  async testConnection(type, config) {
    try {
      const response = await api.post('/settings/test', { type, config });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Connection test failed');
    }
  },

  // Health Check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: 'API unavailable' };
    }
  }
};

export default apiService;