import { v4 as uuidv4 } from 'uuid';

export class Product {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.manufacturerId = data.manufacturerId || null;
    this.description = data.description || '';
    this.price = data.price || null;
    this.internalId = data.internalId || null;
    this.url = data.url || '';
    this.retailer = data.retailer || null;

    // Additional fields
    this.name = data.name || '';
    this.category = data.category || '';
    this.sku = data.sku || null;
    this.availability = data.availability || 'unknown'; // in_stock, out_of_stock, limited, unknown
    this.images = data.images || [];
    this.specifications = data.specifications || {};
    this.reviews = data.reviews || {
      rating: null,
      count: 0,
      reviews: []
    };
    this.variants = data.variants || []; // Size, color, etc.
    this.tags = data.tags || [];

    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastChecked = data.lastChecked || null;
    this.isActive = data.isActive ?? true;
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.url) {
      errors.push('Product URL is required');
    }

    if (!this.retailer) {
      errors.push('Retailer is required');
    }

    if (this.price !== null && (typeof this.price !== 'number' || this.price < 0)) {
      errors.push('Price must be a positive number or null');
    }

    try {
      new globalThis.URL(this.url);
    } catch {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update methods
  updatePrice(newPrice) {
    this.price = newPrice;
    this.updatedAt = new Date().toISOString();
    this.lastChecked = new Date().toISOString();
    return this;
  }

  updateAvailability(status) {
    this.availability = status;
    this.updatedAt = new Date().toISOString();
    this.lastChecked = new Date().toISOString();
    return this;
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date().toISOString();
    }
    return this;
  }

  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      manufacturerId: this.manufacturerId,
      description: this.description,
      price: this.price,
      internalId: this.internalId,
      url: this.url,
      retailer: this.retailer,
      name: this.name,
      category: this.category,
      sku: this.sku,
      availability: this.availability,
      images: this.images,
      specifications: this.specifications,
      reviews: this.reviews,
      variants: this.variants,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastChecked: this.lastChecked,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    return new Product(data);
  }

  // Query helpers
  static getRedisKey(id) {
    return `product:${id}`;
  }

  static getRetailerProductsKey(retailerId) {
    return `retailer:${retailerId}:products`;
  }

  static getCategoryProductsKey(category) {
    return `category:${category}:products`;
  }
}

export default Product;