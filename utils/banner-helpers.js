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
 * Get banner discount information for a product
 * @param {String} productId - Product ID
 * @returns {Object|null} Banner discount info or null if product is not in any banner
 */
const getProductBannerDiscount = async (productId) => {
  try {
    const banner = await Banner.findOne({
      products: productId,
      isAllowed: true
    }).select('percentage _id title');

    if (!banner) {
      return null;
    }

    return {
      bannerId: banner._id,
      bannerTitle: banner.title,
      discountPercentage: banner.percentage
    };
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
    }).select('percentage _id title products');

    const discountsMap = {};
    
    banners.forEach(banner => {
      banner.products.forEach(productId => {
        const productIdStr = productId.toString();
        if (productIds.includes(productIdStr)) {
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
  getProductBannerDiscount,
  getProductsBannerDiscounts,
  applyBannerDiscountToProduct
};
