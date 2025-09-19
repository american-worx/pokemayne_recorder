import express from 'express';
import { getRepository } from '../database/repository.js';
import Product from '../models/Product.js';
import Retailer from '../models/Retailer.js';
import Flow from '../models/Flow.js';
import UserProfile from '../models/UserProfile.js';
import Log from '../models/Log.js';
import logger from '../core/utils/logger.js';

const router = express.Router();

// Middleware to ensure repository is available
router.use(async (req, res, next) => {
  try {
    if (!req.repository) {
      req.repository = await getRepository();
    }
    next();
  } catch (error) {
    logger.error('Database middleware error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// ========== PRODUCT ROUTES ==========

// Get all products with filtering and pagination
router.get('/products', async (req, res) => {
  try {
    const {
      retailer,
      category,
      availability,
      limit = 50,
      offset = 0,
      search
    } = req.query;

    let products = [];

    if (retailer) {
      products = await req.repository.findProductsByRetailer(retailer, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } else {
      // For now, return empty array. In production, implement full product listing
      products = [];
    }

    // Apply additional filters
    if (category) {
      products = products.filter(p => p.category === category);
    }

    if (availability) {
      products = products.filter(p => p.availability === availability);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: products,
      total: products.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Failed to get products:', error);
    res.status(500).json({
      error: 'Failed to retrieve products',
      message: error.message
    });
  }
});

// Get product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await req.repository.loadProduct(id);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        id
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    logger.error(`Failed to get product ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to retrieve product',
      message: error.message
    });
  }
});

// Create or update product
router.post('/products', async (req, res) => {
  try {
    const productData = req.body;
    const product = new Product(productData);

    // Validate product
    const validation = product.validate();
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid product data',
        errors: validation.errors
      });
    }

    // Save to database (in-memory first, database if user chooses to save)
    const savedProduct = await req.repository.saveProduct(product, {
      immediate: productData.save === true
    });

    res.json({
      success: true,
      data: savedProduct,
      saved: productData.save === true
    });

  } catch (error) {
    logger.error('Failed to save product:', error);
    res.status(500).json({
      error: 'Failed to save product',
      message: error.message
    });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingProduct = await req.repository.loadProduct(id);
    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found',
        id
      });
    }

    // Apply updates
    Object.assign(existingProduct, updates);
    existingProduct.updatedAt = new Date().toISOString();

    // Validate updated product
    const validation = existingProduct.validate();
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid product data',
        errors: validation.errors
      });
    }

    const savedProduct = await req.repository.saveProduct(existingProduct, {
      immediate: updates.save === true
    });

    res.json({
      success: true,
      data: savedProduct,
      saved: updates.save === true
    });

  } catch (error) {
    logger.error(`Failed to update product ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to update product',
      message: error.message
    });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await req.repository.delete('Product', id);
    if (!deleted) {
      return res.status(404).json({
        error: 'Product not found',
        id
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    logger.error(`Failed to delete product ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

// ========== RETAILER ROUTES ==========

// Get all retailers
router.get('/retailers', async (req, res) => {
  try {
    const { active: _active, domain: _domain } = req.query;

    // For now, return empty array. In production, implement retailer listing
    const retailers = [];

    res.json({
      success: true,
      data: retailers
    });

  } catch (error) {
    logger.error('Failed to get retailers:', error);
    res.status(500).json({
      error: 'Failed to retrieve retailers',
      message: error.message
    });
  }
});

// Get retailer by ID
router.get('/retailers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const retailer = await req.repository.loadRetailer(id);

    if (!retailer) {
      return res.status(404).json({
        error: 'Retailer not found',
        id
      });
    }

    res.json({
      success: true,
      data: retailer
    });

  } catch (error) {
    logger.error(`Failed to get retailer ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to retrieve retailer',
      message: error.message
    });
  }
});

// Create or update retailer
router.post('/retailers', async (req, res) => {
  try {
    const retailerData = req.body;
    const retailer = new Retailer(retailerData);

    // Validate retailer
    const validation = retailer.validate();
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid retailer data',
        errors: validation.errors
      });
    }

    const savedRetailer = await req.repository.saveRetailer(retailer, {
      immediate: retailerData.save === true
    });

    res.json({
      success: true,
      data: savedRetailer,
      saved: retailerData.save === true
    });

  } catch (error) {
    logger.error('Failed to save retailer:', error);
    res.status(500).json({
      error: 'Failed to save retailer',
      message: error.message
    });
  }
});

// ========== FLOW ROUTES ==========

// Get flows by retailer
router.get('/flows', async (req, res) => {
  try {
    const { retailer, category, active, limit = 50, offset = 0 } = req.query;

    let flows = [];

    if (retailer) {
      flows = await req.repository.findFlowsByRetailer(retailer, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }

    // Apply filters
    if (category) {
      flows = flows.filter(f => f.category === category);
    }

    if (active !== undefined) {
      const isActive = active === 'true';
      flows = flows.filter(f => f.isActive === isActive);
    }

    res.json({
      success: true,
      data: flows,
      total: flows.length
    });

  } catch (error) {
    logger.error('Failed to get flows:', error);
    res.status(500).json({
      error: 'Failed to retrieve flows',
      message: error.message
    });
  }
});

// Get flow by ID
router.get('/flows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const flow = await req.repository.loadFlow(id);

    if (!flow) {
      return res.status(404).json({
        error: 'Flow not found',
        id
      });
    }

    res.json({
      success: true,
      data: flow
    });

  } catch (error) {
    logger.error(`Failed to get flow ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to retrieve flow',
      message: error.message
    });
  }
});

// Create or update flow
router.post('/flows', async (req, res) => {
  try {
    const flowData = req.body;
    const flow = new Flow(flowData);

    // Validate flow
    const validation = flow.validate();
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid flow data',
        errors: validation.errors
      });
    }

    const savedFlow = await req.repository.saveFlow(flow, {
      immediate: flowData.save === true
    });

    res.json({
      success: true,
      data: savedFlow,
      saved: flowData.save === true
    });

  } catch (error) {
    logger.error('Failed to save flow:', error);
    res.status(500).json({
      error: 'Failed to save flow',
      message: error.message
    });
  }
});

// Execute flow
router.post('/flows/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { config: _config = {} } = req.body;

    const flow = await req.repository.loadFlow(id);
    if (!flow) {
      return res.status(404).json({
        error: 'Flow not found',
        id
      });
    }

    // TODO: Implement flow execution logic
    // For now, just return a mock response
    const executionId = `exec_${Date.now()}`;

    res.json({
      success: true,
      executionId,
      flow: flow.id,
      status: 'started',
      message: 'Flow execution started'
    });

  } catch (error) {
    logger.error(`Failed to execute flow ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to execute flow',
      message: error.message
    });
  }
});

// ========== USER PROFILE ROUTES ==========

// Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await req.repository.loadUserProfile(id);

    if (!profile) {
      return res.status(404).json({
        error: 'User profile not found',
        id
      });
    }

    // Return profile without sensitive data
    res.json({
      success: true,
      data: profile.toJSON(false)
    });

  } catch (error) {
    logger.error(`Failed to get user profile ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to retrieve user profile',
      message: error.message
    });
  }
});

// Create or update user profile
router.post('/profile', async (req, res) => {
  try {
    const profileData = req.body;
    const profile = new UserProfile(profileData);

    // Validate profile
    const validation = profile.validate();
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid profile data',
        errors: validation.errors
      });
    }

    const savedProfile = await req.repository.saveUserProfile(profile, {
      immediate: profileData.save === true
    });

    res.json({
      success: true,
      data: savedProfile.toJSON(false),
      saved: profileData.save === true
    });

  } catch (error) {
    logger.error('Failed to save user profile:', error);
    res.status(500).json({
      error: 'Failed to save user profile',
      message: error.message
    });
  }
});

// ========== LOG ROUTES ==========

// Get logs with filtering
router.get('/logs', async (req, res) => {
  try {
    const {
      level,
      category,
      source,
      limit = 100,
      offset = 0,
      recent = false
    } = req.query;

    let logs = [];

    if (recent === 'true') {
      logs = await req.repository.findRecentLogs({ limit: parseInt(limit) });
    } else if (category) {
      logs = await req.repository.findLogsByCategory(category, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } else {
      // Default to recent logs
      logs = await req.repository.findRecentLogs({ limit: parseInt(limit) });
    }

    // Apply additional filters
    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    if (source) {
      logs = logs.filter(log => log.source === source);
    }

    res.json({
      success: true,
      data: logs,
      total: logs.length
    });

  } catch (error) {
    logger.error('Failed to get logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve logs',
      message: error.message
    });
  }
});

// Create log entry
router.post('/logs', async (req, res) => {
  try {
    const logData = req.body;
    const log = new Log(logData);

    const savedLog = await req.repository.saveLog(log);

    res.json({
      success: true,
      data: savedLog
    });

  } catch (error) {
    logger.error('Failed to save log:', error);
    res.status(500).json({
      error: 'Failed to save log',
      message: error.message
    });
  }
});

// ========== BATCH OPERATIONS ==========

// Save all pending changes to database
router.post('/save-all', async (req, res) => {
  try {
    await req.repository.flushPendingWrites();

    res.json({
      success: true,
      message: 'All pending changes saved to database'
    });

  } catch (error) {
    logger.error('Failed to save all changes:', error);
    res.status(500).json({
      error: 'Failed to save changes',
      message: error.message
    });
  }
});

// Get repository statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await req.repository.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get repository stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

// Clear cache
router.post('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;

    req.repository.invalidateCache(pattern);

    res.json({
      success: true,
      message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All cache cleared'
    });

  } catch (error) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

export default router;