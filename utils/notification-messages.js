// Notification Messages Helper
// Provides bilingual notification titles and messages

const { getBilingualMessage } = require('./messages');

/**
 * Get bilingual notification title and message
 * @param {String} titleKey - Message key for title
 * @param {String} messageKey - Message key for message
 * @param {Object} replacements - Object with replacement values for message placeholders
 * @returns {Object} { title: {en, ar}, message: {en, ar} }
 */
function getBilingualNotification(titleKey, messageKey, replacements = {}) {
  const title = getBilingualMessage(titleKey);
  let message = getBilingualMessage(messageKey);
  
  // Replace placeholders in message
  if (replacements && Object.keys(replacements).length > 0) {
    message = {
      en: replacePlaceholders(message.en, replacements),
      ar: replacePlaceholders(message.ar, replacements)
    };
  }
  
  return {
    title,
    message
  };
}

/**
 * Replace placeholders in a string
 * @param {String} text - Text with placeholders like {orderNumber}
 * @param {Object} replacements - Object with replacement values
 * @returns {String} Text with replaced values
 */
function replacePlaceholders(text, replacements) {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Convert old string format notification to bilingual format
 * Tries to match old notification strings to proper bilingual messages
 * @param {String} title - Old title string
 * @param {String} message - Old message string
 * @param {Object} data - Notification data (may contain orderNumber, productName, etc.)
 * @returns {Object} { title: {en, ar}, message: {en, ar} }
 */
function convertOldNotificationToBilingual(title, message, data = {}) {
  // Mapping of old notification patterns to message keys
  const titleMappings = {
    'Order Placed': 'notification_order_placed',
    'Order Confirmed': 'notification_order_confirmed',
    'Order Shipped': 'notification_order_shipped',
    'Order Delivered': 'notification_order_delivered',
    'Order Cancelled': 'notification_order_cancelled',
    'Product Approved': 'notification_product_approved',
    'Product Declined': 'notification_product_declined',
    'Business Approved': 'notification_business_approved',
    'Business Rejected': 'notification_business_rejected',
    'Special Order Created': 'notification_special_order_created',
    'Special Order Reviewed': 'notification_special_order_reviewed',
    'Special Order Contacted': 'notification_special_order_contacted',
    'Special Order Completed': 'notification_special_order_completed',
    'Special Order Cancelled': 'notification_special_order_cancelled'
  };

  // Try to find matching title key
  let titleKey = null;
  for (const [pattern, key] of Object.entries(titleMappings)) {
    if (title === pattern || title?.includes(pattern)) {
      titleKey = key;
      break;
    }
  }

  // Determine message key based on title key
  let messageKey = null;
  let replacements = {};
  
  // Use orderNumber from data if available
  if (data.orderNumber) {
    replacements.orderNumber = data.orderNumber;
  } else if (message) {
    // Extract orderNumber from message if present
    const orderMatch = message.match(/ORD-([A-Z0-9]+)/);
    if (orderMatch) {
      replacements.orderNumber = orderMatch[0];
    }
  }
  
  // Use productName from data if available
  if (data.productId && !replacements.productName) {
    // We have productId but not productName, will need to handle this
  }
  
  // Extract productName from message if present
  if (message) {
    const productMatch = message.match(/"([^"]+)"/);
    if (productMatch) {
      replacements.productName = productMatch[1];
    }
  }
  
  // Extract reason from message if present
  if (message && message.includes(':')) {
    const reasonMatch = message.match(/:\s*(.+)$/);
    if (reasonMatch) {
      replacements.reason = `: ${reasonMatch[1]}`;
    }
  }

  // Map title key to message key
  if (titleKey) {
    const titleToMessageMap = {
      'notification_order_placed': 'notification_order_placed_message',
      'notification_order_confirmed': 'notification_order_confirmed_message',
      'notification_order_shipped': 'notification_order_shipped_message',
      'notification_order_delivered': 'notification_order_delivered_message',
      'notification_order_cancelled': 'notification_order_cancelled_message',
      'notification_product_approved': 'notification_product_approved_message',
      'notification_product_declined': 'notification_product_declined_message',
      'notification_business_approved': 'notification_business_approved_message',
      'notification_business_rejected': 'notification_business_rejected_message',
      'notification_special_order_created': 'notification_special_order_created_message',
      'notification_special_order_reviewed': 'notification_special_order_reviewed_message',
      'notification_special_order_contacted': 'notification_special_order_contacted_message',
      'notification_special_order_completed': 'notification_special_order_completed_message',
      'notification_special_order_cancelled': 'notification_special_order_cancelled_message'
    };
    
    messageKey = titleToMessageMap[titleKey];
  }

  // If we found matching keys, return bilingual version
  if (titleKey && messageKey) {
    return getBilingualNotification(titleKey, messageKey, replacements);
  }

  // Fallback: return as-is with same text for both languages
  return {
    title: { en: title || '', ar: title || '' },
    message: { en: message || '', ar: message || '' }
  };
}

module.exports = {
  getBilingualNotification,
  replacePlaceholders,
  convertOldNotificationToBilingual
};
