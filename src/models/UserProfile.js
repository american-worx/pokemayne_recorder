import { v4 as uuidv4 } from 'uuid';

export class UserProfile {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.shippingAddress = data.shippingAddress || {
      firstName: '',
      lastName: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'US',
      phone: '',
      isDefault: false
    };
    this.billingAddress = data.billingAddress || {
      firstName: '',
      lastName: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'US',
      phone: '',
      isDefault: false,
      sameAsShipping: true
    };
    this.phoneNumber = data.phoneNumber || '';
    this.paymentMethod = data.paymentMethod || {
      type: 'credit_card', // credit_card, debit_card, paypal, apple_pay, google_pay
      cardNumber: '', // Never store real card numbers in plain text
      cardholderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '', // Never store CVV
      isDefault: false
    };

    // Additional contact information
    this.email = data.email || '';
    this.dateOfBirth = data.dateOfBirth || null;
    this.preferences = data.preferences || {
      notifications: {
        email: true,
        sms: false,
        push: true,
        discord: false
      },
      automation: {
        autoCheckout: false,
        maxSpend: null,
        preferredRetailers: [],
        excludedRetailers: []
      },
      privacy: {
        shareData: false,
        analytics: true,
        marketing: false
      }
    };

    // Account credentials for retailers (encrypted)
    this.retailerAccounts = data.retailerAccounts || {};
    // Structure: { retailerId: { username: '', passwordHash: '', cookies: [], lastLogin: '' } }

    // Security settings
    this.security = data.security || {
      twoFactorEnabled: false,
      sessionTimeout: 3600, // 1 hour
      allowedIPs: [],
      lastPasswordChange: null,
      passwordHash: null, // Never store plain text passwords
      recoveryQuestions: []
    };

    // Usage statistics
    this.stats = data.stats || {
      totalOrders: 0,
      successfulPurchases: 0,
      failedAttempts: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      favoriteRetailers: [],
      lastActivity: null
    };

    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLogin = data.lastLogin || null;
    this.isActive = data.isActive ?? true;
    this.isVerified = data.isVerified ?? false;
    this.status = data.status || 'active'; // active, inactive, suspended, banned
  }

  // Validation
  validate() {
    const errors = [];

    // Email validation
    if (!this.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Invalid email format');
    }

    // Phone number validation
    if (this.phoneNumber && !/^\+?[\d\s\-()]+$/.test(this.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    // Shipping address validation
    const shipping = this.shippingAddress;
    if (!shipping.firstName || !shipping.lastName) {
      errors.push('Shipping address: First and last name are required');
    }
    if (!shipping.street1) {
      errors.push('Shipping address: Street address is required');
    }
    if (!shipping.city || !shipping.state || !shipping.zipcode) {
      errors.push('Shipping address: City, state, and zipcode are required');
    }
    if (shipping.zipcode && !/^\d{5}(-\d{4})?$/.test(shipping.zipcode)) {
      errors.push('Shipping address: Invalid zipcode format');
    }

    // Billing address validation (if different from shipping)
    if (!this.billingAddress.sameAsShipping) {
      const billing = this.billingAddress;
      if (!billing.firstName || !billing.lastName) {
        errors.push('Billing address: First and last name are required');
      }
      if (!billing.street1) {
        errors.push('Billing address: Street address is required');
      }
      if (!billing.city || !billing.state || !billing.zipcode) {
        errors.push('Billing address: City, state, and zipcode are required');
      }
      if (billing.zipcode && !/^\d{5}(-\d{4})?$/.test(billing.zipcode)) {
        errors.push('Billing address: Invalid zipcode format');
      }
    }

    // Payment method validation
    if (this.paymentMethod.type === 'credit_card' || this.paymentMethod.type === 'debit_card') {
      if (!this.paymentMethod.cardholderName) {
        errors.push('Payment method: Cardholder name is required');
      }
      // Note: In production, never validate actual card numbers in plain text
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Address management
  updateShippingAddress(address) {
    this.shippingAddress = { ...this.shippingAddress, ...address };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateBillingAddress(address) {
    this.billingAddress = { ...this.billingAddress, ...address };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  syncBillingWithShipping() {
    this.billingAddress = {
      ...this.shippingAddress,
      sameAsShipping: true,
      isDefault: this.billingAddress.isDefault
    };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Payment method management
  updatePaymentMethod(payment) {
    // In production, ensure encryption for sensitive data
    this.paymentMethod = { ...this.paymentMethod, ...payment };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Retailer account management
  addRetailerAccount(retailerId, credentials) {
    // In production, encrypt passwords and sensitive data
    this.retailerAccounts[retailerId] = {
      username: credentials.username,
      passwordHash: credentials.passwordHash, // Should be hashed
      cookies: credentials.cookies || [],
      lastLogin: new Date().toISOString(),
      isActive: true
    };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  removeRetailerAccount(retailerId) {
    delete this.retailerAccounts[retailerId];
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateRetailerAccount(retailerId, updates) {
    if (this.retailerAccounts[retailerId]) {
      this.retailerAccounts[retailerId] = {
        ...this.retailerAccounts[retailerId],
        ...updates
      };
      this.updatedAt = new Date().toISOString();
    }
    return this;
  }

  // Preferences management
  updatePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateNotificationPreferences(notifications) {
    this.preferences.notifications = { ...this.preferences.notifications, ...notifications };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateAutomationPreferences(automation) {
    this.preferences.automation = { ...this.preferences.automation, ...automation };
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Statistics tracking
  recordPurchase(amount, retailerId, success = true) {
    this.stats.totalOrders++;
    this.stats.lastActivity = new Date().toISOString();

    if (success) {
      this.stats.successfulPurchases++;
      this.stats.totalSpent += amount;
      this.stats.averageOrderValue = this.stats.totalSpent / this.stats.successfulPurchases;

      // Update favorite retailers
      const retailerIndex = this.stats.favoriteRetailers.findIndex(r => r.id === retailerId);
      if (retailerIndex >= 0) {
        this.stats.favoriteRetailers[retailerIndex].count++;
        this.stats.favoriteRetailers[retailerIndex].totalSpent += amount;
      } else {
        this.stats.favoriteRetailers.push({
          id: retailerId,
          count: 1,
          totalSpent: amount
        });
      }

      // Sort by count
      this.stats.favoriteRetailers.sort((a, b) => b.count - a.count);
    } else {
      this.stats.failedAttempts++;
    }

    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Security management
  updatePassword(newPasswordHash) {
    this.security.passwordHash = newPasswordHash;
    this.security.lastPasswordChange = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  enableTwoFactor() {
    this.security.twoFactorEnabled = true;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  disableTwoFactor() {
    this.security.twoFactorEnabled = false;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  recordLogin() {
    this.lastLogin = new Date().toISOString();
    this.stats.lastActivity = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Status management
  activate() {
    this.isActive = true;
    this.status = 'active';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  deactivate() {
    this.isActive = false;
    this.status = 'inactive';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  suspend() {
    this.status = 'suspended';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  verify() {
    this.isVerified = true;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Serialization (exclude sensitive data)
  toJSON(includeSensitive = false) {
    const data = {
      id: this.id,
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress,
      phoneNumber: this.phoneNumber,
      email: this.email,
      dateOfBirth: this.dateOfBirth,
      preferences: this.preferences,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
      isActive: this.isActive,
      isVerified: this.isVerified,
      status: this.status
    };

    if (includeSensitive) {
      data.paymentMethod = this.paymentMethod;
      data.retailerAccounts = this.retailerAccounts;
      data.security = this.security;
    } else {
      // Return safe payment method info
      data.paymentMethod = {
        type: this.paymentMethod.type,
        cardholderName: this.paymentMethod.cardholderName,
        lastFour: this.paymentMethod.cardNumber ? `****${this.paymentMethod.cardNumber.slice(-4)}` : '',
        isDefault: this.paymentMethod.isDefault
      };
    }

    return data;
  }

  static fromJSON(data) {
    return new UserProfile(data);
  }

  // Query helpers
  static getRedisKey(id) {
    return `user:${id}`;
  }

  static getEmailKey(email) {
    return `user:email:${email}`;
  }

  static getActiveUsersKey() {
    return 'users:active';
  }
}

export default UserProfile;