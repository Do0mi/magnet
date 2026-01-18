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
 * If product has isInBanner: true, returns discount info even if banner is not active
 * @param {String} productId - Product ID
 * @returns {Object|null} Banner discount info or null if product is not in any banner
 */
const getProductBannerDiscount = async (productId) => {
  try {
    // First, try to find active banners (isAllowed: true and within date range)
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

    // If no active banner found, check if product has isInBanner: true
    // If so, return discount info from any banner containing this product
    const Product = require('../models/product-model');
    const product = await Product.findById(productId).select('isInBanner');
    
    if (product && product.isInBanner) {
      // Find any banner (even if not active) for this product
      const anyBanner = await Banner.findOne({
        products: productId
      }).select('percentage _id title');

      if (anyBanner) {
        return {
          bannerId: anyBanner._id,
          bannerTitle: anyBanner.title,
          discountPercentage: anyBanner.percentage
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
 * Returns discount info for products that are in active banners
 * If a product has isInBanner: true, tries to find an active banner for it
 * @param {Array} productIds - Array of product IDs
 * @returns {Object} Map of productId to banner discount info
 */
const getProductsBannerDiscounts = async (productIds) => {
  try {
    // First, try to find active banners (isAllowed: true and within date range)
    const banners = await Banner.find({
      products: { $in: productIds },
      isAllowed: true
    }).select('percentage _id title products from to');

    const discountsMap = {};
    const currentDate = new Date();
    
    // First pass: only include active banners (within date range)
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

    // Second pass: if product has isInBanner: true but no active banner found,
    // try to find any banner (even if not active) to return discount info
    const Product = require('../models/product-model');
    const productsWithBanner = await Product.find({
      _id: { $in: productIds },
      isInBanner: true
    }).select('_id');

    const productsNeedingDiscount = productsWithBanner
      .map(p => p._id.toString())
      .filter(productIdStr => !discountsMap[productIdStr]);

    if (productsNeedingDiscount.length > 0) {
      // Find any banners (even inactive) for these products
      const anyBanners = await Banner.find({
        products: { $in: productsNeedingDiscount }
      }).select('percentage _id title products');

      anyBanners.forEach(banner => {
        banner.products.forEach(productId => {
          const productIdStr = productId.toString();
          // Only set discount if product needs it and not already assigned
          if (productsNeedingDiscount.includes(productIdStr) && !discountsMap[productIdStr]) {
            discountsMap[productIdStr] = {
              bannerId: banner._id,
              bannerTitle: banner.title,
              discountPercentage: banner.percentage
            };
          }
        });
      });
    }

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
 * Apply discount info to product (returns base pricePerUnit with discount info separately)
 * @param {Object} product - Product object
 * @param {Object} bannerDiscount - Banner discount info
 * @param {String} userCurrency - Target currency for conversion
 * @returns {Object} Product with base pricePerUnit and discount info separately
 */
const applyBannerDiscountToProduct = async (product, bannerDiscount, userCurrency = BASE_CURRENCY) => {
  if (!bannerDiscount || !product.pricePerUnit) {
    // If no discount, just convert the price to user currency
    const basePrice = parseFloat(product.pricePerUnit);
    if (!isNaN(basePrice) && basePrice > 0) {
      const convertedPrice = await convertCurrency(basePrice, userCurrency);
      return {
        ...product,
        pricePerUnit: convertedPrice.toString()
      };
    }
    return product;
  }

  const basePrice = parseFloat(product.pricePerUnit);
  if (isNaN(basePrice) || basePrice <= 0) {
    return product;
  }

  // Convert base price to user currency (this is the pricePerUnit without discount)
  const convertedBasePrice = await convertCurrency(basePrice, userCurrency);
  
  // Calculate discounted price in base currency
  const discountedPriceBase = calculateDiscountedPrice(basePrice, bannerDiscount.discountPercentage);
  
  // Convert discounted price to user currency
  const convertedDiscountedPrice = await convertCurrency(parseFloat(discountedPriceBase), userCurrency);

  // Return product with base pricePerUnit (no discount) and discount info separately
  return {
    ...product,
    pricePerUnit: convertedBasePrice.toString(), // Base price without discount, converted to user currency
    discountPercentage: bannerDiscount.discountPercentage, // Discount percentage if product is in banner
    discountedPrice: convertedDiscountedPrice.toString(), // Discounted price if product is in banner
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
