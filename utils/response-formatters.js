// Response Formatters Utility
// Standardized formatters to reduce repeated data across controllers

/**
 * Format user data with selective fields
 * @param {Object} user - User object from database
 * @param {Object} options - Formatting options
 * @param {boolean} options.includePassword - Include password field (default: false)
 * @param {boolean} options.includeOTP - Include OTP fields (default: false)
 * @param {boolean} options.includeBusinessInfo - Include business info (default: true)
 * @param {boolean} options.includeVerification - Include verification status (default: true)
 * @returns {Object} Formatted user object
 */
const formatUser = (user, options = {}) => {
  if (!user) return null;
  
  const {
    includePassword = false,
    includeOTP = false,
    includeBusinessInfo = true,
    includeVerification = true
  } = options;

  const formatted = {
    id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phone: user.phone,
    role: user.role,
    country: user.country,
    language: user.language,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  if (includeVerification) {
    formatted.isEmailVerified = user.isEmailVerified;
    formatted.isPhoneVerified = user.isPhoneVerified;
  }

  if (includeBusinessInfo && user.businessInfo) {
    formatted.businessInfo = {
      crNumber: user.businessInfo.crNumber,
      vatNumber: user.businessInfo.vatNumber,
      companyName: user.businessInfo.companyName,
      companyType: user.businessInfo.companyType,
      city: user.businessInfo.city,
      district: user.businessInfo.district,
      streetName: user.businessInfo.streetName,
      isApproved: user.businessInfo.isApproved,
      approvalStatus: user.businessInfo.approvalStatus,
      approvedBy: user.businessInfo.approvedBy,
      approvedAt: user.businessInfo.approvedAt,
      rejectionReason: user.businessInfo.rejectionReason
    };
  }

  if (includePassword) {
    formatted.password = user.password;
  }

  if (includeOTP) {
    formatted.emailOTP = user.emailOTP;
    formatted.phoneOTP = user.phoneOTP;
  }

  return formatted;
};

/**
 * Format product data with selective fields
 * @param {Object} product - Product object from database
 * @param {Object} options - Formatting options
 * @param {string} options.language - Language preference (default: 'en')
 * @param {boolean} options.includeOwner - Include owner details (default: true)
 * @param {boolean} options.includeApproval - Include approval details (default: true)
 * @param {boolean} options.includeCustomFields - Include custom fields (default: true)
 * @returns {Object} Formatted product object
 */
const formatProduct = (product, options = {}) => {
  if (!product) return null;
  
  const {
    language = 'en',
    includeOwner = true,
    includeApproval = true,
    includeCustomFields = true
  } = options;

  const formatted = {
    id: product._id,
    code: product.code,
    images: product.images,
    minOrder: product.minOrder,
    pricePerUnit: product.pricePerUnit,
    stock: product.stock,
    rating: product.rating,
    attachments: product.attachments,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };

  // Handle bilingual fields
  if (language === 'both') {
    formatted.name = product.name;
    formatted.description = product.description;
    formatted.category = product.category;
    formatted.unit = product.unit;
    if (includeCustomFields && product.customFields) {
      formatted.customFields = product.customFields;
    }
  } else {
    formatted.name = product.name ? product.name[language] || product.name.en : null;
    formatted.description = product.description ? product.description[language] || product.description.en : null;
    formatted.category = product.category ? product.category[language] || product.category.en : null;
    formatted.unit = product.unit ? product.unit[language] || product.unit.en : null;
    if (includeCustomFields && product.customFields) {
      formatted.customFields = product.customFields.map(field => ({
        key: field.key[language] || field.key.en,
        value: field.value[language] || field.value.en
      }));
    }
  }

  if (includeOwner && product.owner) {
    if (typeof product.owner === 'object' && product.owner.businessInfo) {
      formatted.ownerCompanyName = product.owner.businessInfo.companyName;
    } else {
      formatted.owner = product.owner;
    }
  }

  if (includeApproval) {
    formatted.status = product.status;
    formatted.approvedBy = product.approvedBy;
  }

  return formatted;
};

/**
 * Format order data with selective fields
 * @param {Object} order - Order object from database
 * @param {Object} options - Formatting options
 * @param {string} options.language - Language preference (default: 'en')
 * @param {boolean} options.includeItems - Include order items (default: true)
 * @param {boolean} options.includeCustomer - Include customer details (default: false)
 * @param {boolean} options.includeAddress - Include shipping address (default: true)
 * @param {boolean} options.includeStatusLog - Include status log (default: false)
 * @returns {Object} Formatted order object
 */
const formatOrder = (order, options = {}) => {
  if (!order) return null;
  
  const {
    language = 'en',
    includeItems = true,
    includeCustomer = false,
    includeAddress = true,
    includeStatusLog = false
  } = options;

  const formatted = {
    id: order._id,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };

  // Handle status localization
  if (language === 'both') {
    formatted.status = order.status;
  } else {
    formatted.status = order.status ? order.status[language] || order.status.en : null;
  }

  if (includeCustomer && order.customer) {
    if (typeof order.customer === 'object') {
      formatted.customer = formatUser(order.customer, { 
        includeBusinessInfo: false, 
        includeVerification: false 
      });
    } else {
      formatted.customer = order.customer;
    }
  }

  if (includeAddress && order.shippingAddress) {
    if (typeof order.shippingAddress === 'object') {
      formatted.shippingAddress = {
        id: order.shippingAddress._id,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      };
    } else {
      formatted.shippingAddress = order.shippingAddress;
    }
  }

  if (includeItems && order.items) {
    formatted.items = order.items.map(item => ({
      product: typeof item.product === 'object' ? formatProduct(item.product, { 
        language, 
        includeOwner: false, 
        includeApproval: false 
      }) : item.product,
      quantity: item.quantity
    }));
  }

  if (includeStatusLog && order.statusLog) {
    formatted.statusLog = order.statusLog.map(log => ({
      status: language === 'both' ? log.status : (log.status[language] || log.status.en),
      timestamp: log.timestamp
    }));
  }

  return formatted;
};

/**
 * Format category data with selective fields
 * @param {Object} category - Category object from database
 * @param {Object} options - Formatting options
 * @param {string} options.language - Language preference (default: 'en')
 * @param {boolean} options.includeCreator - Include creator details (default: false)
 * @returns {Object} Formatted category object
 */
const formatCategory = (category, options = {}) => {
  if (!category) return null;
  
  const {
    language = 'en',
    includeCreator = false
  } = options;

  const formatted = {
    id: category._id,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };

  // Handle bilingual fields
  if (language === 'both') {
    formatted.name = category.name;
    formatted.description = category.description;
  } else {
    formatted.name = category.name ? category.name[language] || category.name.en : null;
    formatted.description = category.description ? category.description[language] || category.description.en : null;
  }

  if (includeCreator && category.createdBy) {
    if (typeof category.createdBy === 'object') {
      formatted.createdBy = formatUser(category.createdBy, { 
        includeBusinessInfo: false, 
        includeVerification: false 
      });
    } else {
      formatted.createdBy = category.createdBy;
    }
  }

  return formatted;
};

/**
 * Format review data with selective fields
 * @param {Object} review - Review object from database
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeUser - Include user details (default: true)
 * @param {boolean} options.includeProduct - Include product details (default: false)
 * @returns {Object} Formatted review object
 */
const formatReview = (review, options = {}) => {
  if (!review) return null;
  
  const {
    includeUser = true,
    includeProduct = false
  } = options;

  const formatted = {
    id: review._id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt
  };

  if (includeUser && review.user) {
    if (typeof review.user === 'object') {
      formatted.user = formatUser(review.user, { 
        includeBusinessInfo: false, 
        includeVerification: false 
      });
    } else {
      formatted.user = review.user;
    }
  }

  if (includeProduct && review.product) {
    if (typeof review.product === 'object') {
      formatted.product = formatProduct(review.product, { 
        includeOwner: false, 
        includeApproval: false,
        includeCustomFields: false
      });
    } else {
      formatted.product = review.product;
    }
  }

  return formatted;
};

/**
 * Format address data
 * @param {Object} address - Address object from database
 * @returns {Object} Formatted address object
 */
const formatAddress = (address) => {
  if (!address) return null;
  
  return {
    id: address._id,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt
  };
};

/**
 * Create standardized API response
 * @param {string} status - Response status ('success' or 'error')
 * @param {Object} data - Response data
 * @param {Object} message - Bilingual message object
 * @param {Object} options - Additional options
 * @returns {Object} Standardized response object
 */
const createResponse = (status, data = null, message = null, options = {}) => {
  const response = { status };
  
  if (data) {
    response.data = data;
  }
  
  if (message) {
    response.message = message;
  }
  
  if (options.pagination) {
    response.pagination = options.pagination;
  }
  
  return response;
};

module.exports = {
  formatUser,
  formatProduct,
  formatOrder,
  formatCategory,
  formatReview,
  formatAddress,
  createResponse
};
