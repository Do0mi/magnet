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
    phone: user.phone || null,
    role: user.role,
    country: user.country,
    language: user.language,
    imageUrl: user.imageUrl || null,
    isAllowed: user.isAllowed,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  if (includeVerification) {
    formatted.isEmailVerified = user.isEmailVerified;
    formatted.isPhoneVerified = user.isPhoneVerified;
    if (user.allowedBy) {
      formatted.allowedBy = user.allowedBy;
      formatted.allowedAt = user.allowedAt;
    }
    formatted.disallowReason = user.disallowReason || null;
    if (user.disallowedBy && typeof user.disallowedBy === 'object') {
      formatted.disallowedBy = {
        id: user.disallowedBy._id,
        firstname: user.disallowedBy.firstname,
        lastname: user.disallowedBy.lastname,
        email: user.disallowedBy.email,
        role: user.disallowedBy.role
      };
    } else if (user.disallowedBy) {
      formatted.disallowedBy = { id: user.disallowedBy };
    } else {
      formatted.disallowedBy = null;
    }
    formatted.disallowedAt = user.disallowedAt || null;

    // If user is allowed, hide disallow fields completely
    if (user.isAllowed) {
      delete formatted.disallowReason;
      delete formatted.disallowedBy;
      delete formatted.disallowedAt;
    }
  }

  if (includeBusinessInfo && user.businessInfo) {
    formatted.businessInfo = {
      crNumber: user.businessInfo.crNumber || null,
      vatNumber: user.businessInfo.vatNumber || null,
      companyName: user.businessInfo.companyName || null,
      companyType: user.businessInfo.companyType || null,
      approvalStatus: user.businessInfo.approvalStatus
    };

    // Handle address fields - check if they exist directly or nested under address
    if (user.businessInfo.address) {
      formatted.businessInfo.address = {
        city: user.businessInfo.address.city,
        district: user.businessInfo.address.district,
        streetName: user.businessInfo.address.streetName
      };
    } else {
      // Fallback for old data structure where address fields were directly on businessInfo
      formatted.businessInfo.address = {
        city: user.businessInfo.city || null,
        district: user.businessInfo.district || null,
        streetName: user.businessInfo.streetName || null
      };
    }
    
    // If approvedBy is populated, format it properly; otherwise include id or null
    if (user.businessInfo.approvedBy && typeof user.businessInfo.approvedBy === 'object') {
      formatted.businessInfo.approvedBy = {
        id: user.businessInfo.approvedBy._id,
        firstname: user.businessInfo.approvedBy.firstname,
        lastname: user.businessInfo.approvedBy.lastname,
        email: user.businessInfo.approvedBy.email,
        role: user.businessInfo.approvedBy.role
      };
    } else if (user.businessInfo.approvedBy) {
      formatted.businessInfo.approvedBy = { id: user.businessInfo.approvedBy };
    }
    if (user.businessInfo.approvedAt) {
      formatted.businessInfo.approvedAt = user.businessInfo.approvedAt;
    }
    
    // If rejectedBy is populated, format it properly; otherwise include id or null
    if (user.businessInfo.rejectedBy && typeof user.businessInfo.rejectedBy === 'object') {
      formatted.businessInfo.rejectedBy = {
        id: user.businessInfo.rejectedBy._id,
        firstname: user.businessInfo.rejectedBy.firstname,
        lastname: user.businessInfo.rejectedBy.lastname,
        email: user.businessInfo.rejectedBy.email,
        role: user.businessInfo.rejectedBy.role
      };
    } else if (user.businessInfo.rejectedBy) {
      formatted.businessInfo.rejectedBy = { id: user.businessInfo.rejectedBy };
    }
    if (user.businessInfo.rejectedAt) {
      formatted.businessInfo.rejectedAt = user.businessInfo.rejectedAt;
    }
    if (user.businessInfo.rejectionReason) {
      formatted.businessInfo.rejectionReason = user.businessInfo.rejectionReason;
    }

    // Conditionally show approval/rejection metadata based on status
    const status = user.businessInfo.approvalStatus;
    if (status === 'approved') {
      // Ensure only approval metadata is present (and keep core business fields)
      delete formatted.businessInfo.rejectedBy;
      delete formatted.businessInfo.rejectedAt;
      delete formatted.businessInfo.rejectionReason;
      // Always include approvedBy key (null if missing)
      if (formatted.businessInfo.approvedBy === undefined) {
        formatted.businessInfo.approvedBy = null;
      }
      if (formatted.businessInfo.approvedAt === undefined) {
        formatted.businessInfo.approvedAt = null;
      }
    } else if (status === 'rejected') {
      // Show only rejection metadata (and keep core business fields)
      delete formatted.businessInfo.approvedBy;
      delete formatted.businessInfo.approvedAt;
      // Always include rejection keys (null if missing)
      if (formatted.businessInfo.rejectedBy === undefined) {
        formatted.businessInfo.rejectedBy = null;
      }
      if (formatted.businessInfo.rejectedAt === undefined) {
        formatted.businessInfo.rejectedAt = null;
      }
      if (formatted.businessInfo.rejectionReason === undefined) {
        formatted.businessInfo.rejectionReason = null;
      }
    } else {
      // Pending: businessInfo should contain ONLY approvalStatus
      formatted.businessInfo = { approvalStatus: status };
    }
  }

  if (includePassword) {
    formatted.password = user.password;
  }

  if (includeOTP) {
    formatted.emailOTP = user.emailOTP;
    formatted.phoneOTP = user.phoneOTP;
  }

  // Add accessPages for admin and employee roles
  if (user.role === 'admin' || user.role === 'magnet_employee') {
    formatted.accessPages = user.accessPages || {
      dashboard: false,
      analytics: false,
      users: false,
      products: false,
      orders: false,
      reviews: false,
      wishlists: false,
      categories: false,
      addresses: false
    };
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
    isAllowed: product.isAllowed,
    declinedReason: product.declinedReason,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    reviewCount: typeof product.reviewCount === 'number' ? product.reviewCount : 0
  };

  // Handle bilingual fields - always return both languages by default
  formatted.name = product.name;
  formatted.description = product.description;
  formatted.category = product.category;
  formatted.unit = product.unit;
  if (includeCustomFields && product.customFields) {
    formatted.customFields = product.customFields;
  }

  if (includeOwner && product.owner) {
    if (typeof product.owner === 'object') {
      const companyName =
        product.owner.businessInfo?.companyName ??
        product.owner.companyName ??
        null;

      formatted.owner = {
        id: product.owner._id,
        firstname: product.owner.firstname,
        lastname: product.owner.lastname,
        email: product.owner.email,
        role: product.owner.role
      };

      // Include business-specific info or fallback company name
      if (product.owner.role === 'business') {
        formatted.owner.businessInfo = {
          companyName,
          companyType:
            product.owner.businessInfo?.companyType ??
            product.owner.companyType ??
            null
        };
      } else if (companyName) {
        formatted.owner.companyName = companyName;
      }
    } else {
      formatted.owner = product.owner;
    }
  }

  if (includeApproval) {
    formatted.status = product.status;
    if (product.approvedBy && typeof product.approvedBy === 'object') {
      formatted.approvedBy = {
        id: product.approvedBy._id,
        firstname: product.approvedBy.firstname,
        lastname: product.approvedBy.lastname,
        email: product.approvedBy.email,
        role: product.approvedBy.role
      };
    } else {
      formatted.approvedBy = product.approvedBy || null;
    }
    
    // Add decline information if product is declined
    if (product.status === 'declined') {
      formatted.declinedBy = formatted.approvedBy; // Same person who declined
      formatted.declinedAt = product.updatedAt;
    }
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
 * @param {boolean} options.includeTotal - Include total calculation (default: true)
 * @returns {Object} Formatted order object
 */
const formatOrder = (order, options = {}) => {
  if (!order) return null;
  
  const {
    language = 'en',
    includeItems = true,
    includeCustomer = true,
    includeAddress = true,
    includeStatusLog = false,
    includeTotal = true
  } = options;

  const formatted = {
    id: order._id,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };

  // Handle status localization - always return both languages by default
  formatted.status = order.status;

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
        ...(order.shippingAddress.addressLine2 && { addressLine2: order.shippingAddress.addressLine2 }),
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      };
    } else {
      formatted.shippingAddress = order.shippingAddress;
    }
  }

  // Format items and calculate totals (with fallback for existing orders)
  let calculatedTotal = 0;
  if (includeItems && order.items) {
    formatted.items = order.items.map(item => {
      const formattedItem = {
        product: typeof item.product === 'object' ? formatProduct(item.product, { 
          language, 
          includeOwner: false, 
          includeApproval: false 
        }) : item.product,
        quantity: item.quantity
      };

      if (includeTotal) {
        // Use stored itemTotal if available, otherwise calculate it
        let itemTotal = item.itemTotal || 0;
        
        // If itemTotal is 0 and we have product info, calculate it dynamically
        if (itemTotal === 0 && item.product && typeof item.product === 'object' && item.product.pricePerUnit && item.quantity) {
          const price = parseFloat(item.product.pricePerUnit) || 0;
          itemTotal = price * item.quantity;
        }
        
        formattedItem.itemTotal = itemTotal;
        calculatedTotal += itemTotal;
      }

      return formattedItem;
    });
  }

  // Use stored total or calculated total
  if (includeTotal) {
    // If stored total is 0 but we calculated a total, use the calculated one
    formatted.total = (order.total && order.total > 0) ? order.total : calculatedTotal;
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
    includeCreator = true
  } = options;

  const formatted = {
    id: category._id,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };

  // Handle bilingual fields - always return both languages by default
  formatted.name = category.name;
  formatted.description = category.description;
  formatted.status = category.status; // Status is now a simple string

  if (includeCreator && category.createdBy) {
    if (typeof category.createdBy === 'object') {
      formatted.createdBy = {
        id: category.createdBy._id || category.createdBy.id,
        firstname: category.createdBy.firstname,
        lastname: category.createdBy.lastname,
        email: category.createdBy.email,
        role: category.createdBy.role
      };
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
    includeProduct = true
  } = options;

  const formatted = {
    id: review._id,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt
  };

  // Add rejection details if review is rejected
  if (review.status === 'reject') {
    if (review.rejectedBy && typeof review.rejectedBy === 'object') {
      formatted.rejectedBy = {
        id: review.rejectedBy._id,
        firstname: review.rejectedBy.firstname,
        lastname: review.rejectedBy.lastname,
        email: review.rejectedBy.email,
        role: review.rejectedBy.role
      };
    } else {
      formatted.rejectedBy = review.rejectedBy;
    }
    formatted.rejectedAt = review.rejectedAt;
    formatted.rejectionReason = review.rejectionReason;
  }

  if (includeUser && review.user) {
    if (typeof review.user === 'object') {
      // For reviews, we only need basic user info without virtual fields
      formatted.user = {
        id: review.user._id,
        firstname: review.user.firstname,
        lastname: review.user.lastname,
        email: review.user.email,
        role: review.user.role
      };
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
  
  const formatted = {
    id: address._id,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt
  };

  // If user is populated, include user details
  if (address.user && typeof address.user === 'object') {
    formatted.user = formatUser(address.user, { 
      includeBusinessInfo: false, 
      includeVerification: false 
    });
  }

  return formatted;
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

