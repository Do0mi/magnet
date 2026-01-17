// Banner Helpers - Utility functions for banner-related operations
const Banner = require('../models/banner-model');
const { convertCurrency, BASE_CURRENCY } = require('../services/currency-service');

// Helper function to calculate discounted price
const calculateDiscountedPrice = (originalPrice, percentage) => {
  const price = parseFloat(originalPrice);
  if (isNaN(price) || price <= 0) return originalPrice;
  const discount = price * (percentage / 100);
  return (price - discount).toFixed(2);
};

/**
 * Check if a banner is currently allowed based on isAllowed flag and date range
 * @param {Object} banner - Banner object
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {boolean} True if banner is currently allowed
 */
const isBannerCurrentlyAllowed = (banner, currentDate = new Date()) => {
  // First check if banner is explicitly disallowed
  if (!banner.isAllowed) {
    return false;
  }

  // If no date range is set, banner is allowed (if isAllowed is true)
  if (!banner.from && !banner.to) {
    return true;
  }

  // Check if current date is before the 'from' date
  if (banner.from && currentDate < new Date(banner.from)) {
    return false;
  }

  // Check if current date is after the 'to' date
  if (banner.to && currentDate > new Date(banner.to)) {
    return false;
  }

  // Banner is within the date range
  return true;
};

/**
 * Get banner discount information for a product
 * @param {String} productId - Product ID
 * @returns {Object|null} Banner discount info or null if product is not in any banner
 */
const getProductBannerDiscount = async (productId) => {
  try {
    const banners = await Banner.find({
      products: productId,
      isAllowed: true
    }).select('percentage _id title from to');

    // Find the first banner that is currently allowed (within date range)
    const currentDate = new Date();
    for (const banner of banners) {
      if (isBannerCurrentlyAllowed(banner, currentDate)) {
        return {
          bannerId: banner._id,
          bannerTitle: banner.title,
          discountPercentage: banner.percentage
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting product banner discount:', error);
    return null;
  }
};

/**
 * Get banner discount information for multiple products
 * @param {Array} productIds - Array of product IDs
 * @returns {Object} Map of productId to banner discount info
 */
const getProductsBannerDiscounts = async (productIds) => {
  try {
    const banners = await Banner.find({
      products: { $in: productIds },
      isAllowed: true
    }).select('percentage _id title products from to');

    const discountsMap = {};
    const currentDate = new Date();
    
    banners.forEach(banner => {
      // Only include banner if it's currently allowed (within date range)
      if (!isBannerCurrentlyAllowed(banner, currentDate)) {
        return;
      }

      banner.products.forEach(productId => {
        const productIdStr = productId.toString();
        // Only set discount if product is in the list and not already assigned
        if (productIds.includes(productIdStr) && !discountsMap[productIdStr]) {
          discountsMap[productIdStr] = {
            bannerId: banner._id,
            bannerTitle: banner.title,
            discountPercentage: banner.percentage
          };
        }
      });
    });

    return discountsMap;
  } catch (error) {
    console.error('Error getting products banner discounts:', error);
    return {};
  }
};

/**
 * Automatically disable expired banners (set isAllowed to false)
 * This function finds all banners where:
 * - isAllowed is true
 * - to date has passed
 * And sets their isAllowed to false
 * @returns {Promise<Object>} Result with count of disabled banners
 */
const disableExpiredBanners = async () => {
  try {
    const currentDate = new Date();
    
    // Find all banners that are allowed but have passed their 'to' date
    const result = await Banner.updateMany(
      {
        isAllowed: true,
        to: { $exists: true, $lt: currentDate }
      },
      {
        $set: { 
          isAllowed: false,
          updatedAt: currentDate
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Banner Helpers] Disabled ${result.modifiedCount} expired banner(s)`);
    }

    return {
      success: true,
      disabledCount: result.modifiedCount
    };
  } catch (error) {
    console.error('[Banner Helpers] Error disabling expired banners:', error);
    return {
      success: false,
      error: error.message,
      disabledCount: 0
    };
  }
};

/**
 * Apply discount to product price
 * @param {Object} product - Product object
 * @param {Object} bannerDiscount - Banner discount info
 * @param {String} userCurrency - Target currency for conversion
 * @returns {Object} Product with discount applied
 */
const applyBannerDiscountToProduct = async (product, bannerDiscount, userCurrency = BASE_CURRENCY) => {
  if (!bannerDiscount || !product.pricePerUnit) {
    return product;
  }

  const basePrice = parseFloat(product.pricePerUnit);
  if (isNaN(basePrice) || basePrice <= 0) {
    return product;
  }

  // Calculate discounted price
  const discountedPrice = calculateDiscountedPrice(basePrice, bannerDiscount.discountPercentage);
  
  // Convert to user currency
  const convertedPrice = await convertCurrency(parseFloat(discountedPrice), userCurrency);
  const convertedOriginalPrice = await convertCurrency(basePrice, userCurrency);

  // Return product with discount info
  return {
    ...product,
    pricePerUnit: convertedPrice.toString(),
    originalPrice: convertedOriginalPrice.toString(),
    discountPercentage: bannerDiscount.discountPercentage,
    discountedPrice: convertedPrice.toString(),
    bannerId: bannerDiscount.bannerId,
    bannerTitle: bannerDiscount.bannerTitle
  };
};

module.exports = {
  calculateDiscountedPrice,
  isBannerCurrentlyAllowed,
  disableExpiredBanners,
  getProductBannerDiscount,
  getProductsBannerDiscounts,
  applyBannerDiscountToProduct
};
