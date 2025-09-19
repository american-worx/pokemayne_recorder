import { apiService } from './api';

class DatabaseService {
  constructor() {
    this.baseUrl = '/api/db';
    this.inMemoryData = {
      products: new Map(),
      retailers: new Map(),
      flows: new Map(),
      profiles: new Map(),
      logs: []
    };
    this.isDirty = false; // Track if there are unsaved changes
  }

  // ========== PRODUCT METHODS ==========

  async getProducts(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await apiService.get(`${this.baseUrl}/products?${params}`);

      if (response.data.success) {
        // Update in-memory cache
        response.data.data.forEach(product => {
          this.inMemoryData.products.set(product.id, product);
        });
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get products:', error);
      // Return cached data if API fails
      return Array.from(this.inMemoryData.products.values());
    }
  }

  async getProduct(id) {
    try {
      // Check cache first
      if (this.inMemoryData.products.has(id)) {
        return this.inMemoryData.products.get(id);
      }

      const response = await apiService.get(`${this.baseUrl}/products/${id}`);
      if (response.data.success) {
        this.inMemoryData.products.set(id, response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get product ${id}:`, error);
      return this.inMemoryData.products.get(id) || null;
    }
  }

  async saveProduct(product, persistImmediately = false) {
    try {
      // Update in-memory cache immediately
      this.inMemoryData.products.set(product.id, { ...product });
      this.isDirty = true;

      const response = await apiService.post(`${this.baseUrl}/products`, {
        ...product,
        save: persistImmediately
      });

      if (response.data.success) {
        if (persistImmediately) {
          this.isDirty = false;
        }
        return response.data.data;
      }
      throw new Error('Failed to save product');
    } catch (error) {
      console.error('Failed to save product:', error);
      throw error;
    }
  }

  async updateProduct(id, updates, persistImmediately = false) {
    try {
      // Update in-memory cache
      const existing = this.inMemoryData.products.get(id);
      if (existing) {
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        this.inMemoryData.products.set(id, updated);
        this.isDirty = true;
      }

      const response = await apiService.put(`${this.baseUrl}/products/${id}`, {
        ...updates,
        save: persistImmediately
      });

      if (response.data.success) {
        if (persistImmediately) {
          this.isDirty = false;
        }
        return response.data.data;
      }
      throw new Error('Failed to update product');
    } catch (error) {
      console.error(`Failed to update product ${id}:`, error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      this.inMemoryData.products.delete(id);
      this.isDirty = true;

      const response = await apiService.delete(`${this.baseUrl}/products/${id}`);
      return response.data.success;
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      throw error;
    }
  }

  // ========== RETAILER METHODS ==========

  async getRetailers(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await apiService.get(`${this.baseUrl}/retailers?${params}`);

      if (response.data.success) {
        response.data.data.forEach(retailer => {
          this.inMemoryData.retailers.set(retailer.id, retailer);
        });
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get retailers:', error);
      return Array.from(this.inMemoryData.retailers.values());
    }
  }

  async getRetailer(id) {
    try {
      if (this.inMemoryData.retailers.has(id)) {
        return this.inMemoryData.retailers.get(id);
      }

      const response = await apiService.get(`${this.baseUrl}/retailers/${id}`);
      if (response.data.success) {
        this.inMemoryData.retailers.set(id, response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get retailer ${id}:`, error);
      return this.inMemoryData.retailers.get(id) || null;
    }
  }

  async saveRetailer(retailer, persistImmediately = false) {
    try {
      this.inMemoryData.retailers.set(retailer.id, { ...retailer });
      this.isDirty = true;

      const response = await apiService.post(`${this.baseUrl}/retailers`, {
        ...retailer,
        save: persistImmediately
      });

      if (response.data.success) {
        if (persistImmediately) {
          this.isDirty = false;
        }
        return response.data.data;
      }
      throw new Error('Failed to save retailer');
    } catch (error) {
      console.error('Failed to save retailer:', error);
      throw error;
    }
  }

  // ========== FLOW METHODS ==========

  async getFlows(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await apiService.get(`${this.baseUrl}/flows?${params}`);

      if (response.data.success) {
        response.data.data.forEach(flow => {
          this.inMemoryData.flows.set(flow.id, flow);
        });
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get flows:', error);
      return Array.from(this.inMemoryData.flows.values());
    }
  }

  async getFlow(id) {
    try {
      if (this.inMemoryData.flows.has(id)) {
        return this.inMemoryData.flows.get(id);
      }

      const response = await apiService.get(`${this.baseUrl}/flows/${id}`);
      if (response.data.success) {
        this.inMemoryData.flows.set(id, response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get flow ${id}:`, error);
      return this.inMemoryData.flows.get(id) || null;
    }
  }

  async saveFlow(flow, persistImmediately = false) {
    try {
      this.inMemoryData.flows.set(flow.id, { ...flow });
      this.isDirty = true;

      const response = await apiService.post(`${this.baseUrl}/flows`, {
        ...flow,
        save: persistImmediately
      });

      if (response.data.success) {
        if (persistImmediately) {
          this.isDirty = false;
        }
        return response.data.data;
      }
      throw new Error('Failed to save flow');
    } catch (error) {
      console.error('Failed to save flow:', error);
      throw error;
    }
  }

  async executeFlow(id, config = {}) {
    try {
      const response = await apiService.post(`${this.baseUrl}/flows/${id}/execute`, config);
      return response.data;
    } catch (error) {
      console.error(`Failed to execute flow ${id}:`, error);
      throw error;
    }
  }

  // ========== USER PROFILE METHODS ==========

  async getUserProfile(id) {
    try {
      if (this.inMemoryData.profiles.has(id)) {
        return this.inMemoryData.profiles.get(id);
      }

      const response = await apiService.get(`${this.baseUrl}/profile/${id}`);
      if (response.data.success) {
        this.inMemoryData.profiles.set(id, response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get user profile ${id}:`, error);
      return this.inMemoryData.profiles.get(id) || null;
    }
  }

  async saveUserProfile(profile, persistImmediately = false) {
    try {
      this.inMemoryData.profiles.set(profile.id, { ...profile });
      this.isDirty = true;

      const response = await apiService.post(`${this.baseUrl}/profile`, {
        ...profile,
        save: persistImmediately
      });

      if (response.data.success) {
        if (persistImmediately) {
          this.isDirty = false;
        }
        return response.data.data;
      }
      throw new Error('Failed to save user profile');
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  }

  // ========== LOG METHODS ==========

  async getLogs(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await apiService.get(`${this.baseUrl}/logs?${params}`);

      if (response.data.success) {
        // Update in-memory cache (keep only recent logs)
        this.inMemoryData.logs = response.data.data;
        return response.data.data;
      }
      return this.inMemoryData.logs;
    } catch (error) {
      console.error('Failed to get logs:', error);
      return this.inMemoryData.logs;
    }
  }

  async saveLog(log) {
    try {
      // Add to in-memory cache
      this.inMemoryData.logs.unshift(log);
      // Keep only last 1000 logs in memory
      if (this.inMemoryData.logs.length > 1000) {
        this.inMemoryData.logs = this.inMemoryData.logs.slice(0, 1000);
      }

      const response = await apiService.post(`${this.baseUrl}/logs`, log);
      return response.data.success;
    } catch (error) {
      console.error('Failed to save log:', error);
      return false;
    }
  }

  // ========== BATCH OPERATIONS ==========

  async saveAllChanges() {
    try {
      const response = await apiService.post(`${this.baseUrl}/save-all`);
      if (response.data.success) {
        this.isDirty = false;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save all changes:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await apiService.get(`${this.baseUrl}/stats`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  }

  async clearCache(pattern = null) {
    try {
      const response = await apiService.post(`${this.baseUrl}/cache/clear`, { pattern });
      return response.data.success;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  // ========== UTILITY METHODS ==========

  hasUnsavedChanges() {
    return this.isDirty;
  }

  getInMemoryData() {
    return {
      products: Array.from(this.inMemoryData.products.values()),
      retailers: Array.from(this.inMemoryData.retailers.values()),
      flows: Array.from(this.inMemoryData.flows.values()),
      profiles: Array.from(this.inMemoryData.profiles.values()),
      logs: this.inMemoryData.logs.slice(0, 100) // Return latest 100 logs
    };
  }

  clearInMemoryData() {
    this.inMemoryData = {
      products: new Map(),
      retailers: new Map(),
      flows: new Map(),
      profiles: new Map(),
      logs: []
    };
    this.isDirty = false;
  }

  // Create convenience methods for common operations
  async createProduct(productData) {
    const product = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...productData
    };
    return this.saveProduct(product);
  }

  async createRetailer(retailerData) {
    const retailer = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...retailerData
    };
    return this.saveRetailer(retailer);
  }

  async createFlow(flowData) {
    const flow = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...flowData
    };
    return this.saveFlow(flow);
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
const databaseService = new DatabaseService();

export default databaseService;