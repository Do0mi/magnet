// User Banners Controller - Customer Banner Access
const mongoose = require('mongoose');
const Banner = require('../../../models/banner-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatBanner, formatProduct } = require('../../../utils/response-formatters');
const { convertCurrency, BASE_CURRENCY } = require('../../../services/currency-service');
const { isBannerCurrentlyAllowed, disableExpiredBanners } = require('../../../utils/banner-helpers');

// Helper function to calculate discounted price
const calculateDiscountedPrice = (originalPrice, percentage) => {
  const price = parseFloat(originalPrice);
  if (isNaN(price) || price <= 0) return originalPrice;
  const discount = price * (percentage / 100);
  return (price - discount).toFixed(2);
};

// GET /api/v1/user/banners - Get all banners with products (only allowed banners within date range)
exports.getBanners = async (req, res) => {
  try {
    // Automatically disable expired banners before fetching
    await disableExpiredBanners();

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get all banners that are explicitly allowed
    const allBanners = await Banner.find({ isAllowed: true })
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .sort({ createdAt: -1 });

    // Filter banners to only include those currently allowed (within date range)
    const currentDate = new Date();
    const allowedBanners = allBanners.filter(banner => 
      isBannerCurrentlyAllowed(banner, currentDate)
    );

    // Apply pagination to filtered results
    const total = allowedBanners.length;
    const banners = allowedBanners.slice(skip, skip + parseInt(limit));

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Get products with discounts for each banner
    const bannersWithProducts = await Promise.all(
      banners.map(async (banner) => {
        // Get products with discounts
        let discountedProducts = [];
        if (banner.products && banner.products.length > 0) {
          const products = await Product.find({
            _id: { $in: banner.products },
            status: 'approved',
            isAllowed: true
          })
            .populate('category', 'name')
            .populate('owner', 'firstname lastname email role businessInfo.companyName')
            .populate('approvedBy', 'firstname lastname email role');

          discountedProducts = await Promise.all(
            products.map(async (product) => {
              const formatted = formatProduct(product);
              
              // Apply discount and convert currency
              if (formatted.pricePerUnit) {
                const basePrice = parseFloat(formatted.pricePerUnit);
                if (!isNaN(basePrice) && basePrice > 0) {
                  // Calculate discounted price
                  const discountedPrice = calculateDiscountedPrice(basePrice, banner.percentage);
                  
                  // Convert to user currency
                  const convertedPrice = await convertCurrency(parseFloat(discountedPrice), userCurrency);
                  
                  formatted.pricePerUnit = convertedPrice.toString();
                  formatted.originalPrice = basePrice.toString(); // Keep original for reference
                  formatted.discountPercentage = banner.percentage;
                  formatted.discountedPrice = convertedPrice.toString();
                }
              }
              
              return formatted;
            })
          );
        }

        const formattedBanner = formatBanner(banner, { includeProducts: false });
        return {
          ...formattedBanner,
          products: discountedProducts
        };
      })
    );

    res.status(200).json(createResponse('success', {
      banners: bannersWithProducts,
      currency: userCurrency,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBanners: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_banners')
    });
  }
};

// GET /api/v1/user/banners/:id - Get banner by id with discounted products
exports.getBannerById = async (req, res) => {
  try {
    // Validate that the ID parameter is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_banner_id')
      });
    }

    const banner = await Banner.findById(req.params.id)
      .populate('owner', 'firstname lastname email role businessInfo.companyName');

    if (!banner) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('banner_not_found')
      });
    }

    // Customers can only see banners that are currently allowed (within date range)
    const currentDate = new Date();
    if (!isBannerCurrentlyAllowed(banner, currentDate)) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Get products with discounts
    let discountedProducts = [];
    if (banner.products && banner.products.length > 0) {
      const products = await Product.find({
        _id: { $in: banner.products },
        status: 'approved',
        isAllowed: true
      })
        .populate('category', 'name')
        .populate('owner', 'firstname lastname email role businessInfo.companyName')
        .populate('approvedBy', 'firstname lastname email role');

      discountedProducts = await Promise.all(
        products.map(async (product) => {
          const formatted = formatProduct(product);
          
          // Apply discount and convert currency
          if (formatted.pricePerUnit) {
            const basePrice = parseFloat(formatted.pricePerUnit);
            if (!isNaN(basePrice) && basePrice > 0) {
              // Calculate discounted price
              const discountedPrice = calculateDiscountedPrice(basePrice, banner.percentage);
              
              // Convert to user currency
              const convertedPrice = await convertCurrency(parseFloat(discountedPrice), userCurrency);
              
              formatted.pricePerUnit = convertedPrice.toString();
              formatted.originalPrice = basePrice.toString(); // Keep original for reference
              formatted.discountPercentage = banner.percentage;
              formatted.discountedPrice = convertedPrice.toString();
            }
          }
          
          return formatted;
        })
      );
    }

    const formattedBanner = formatBanner(banner, { includeProducts: false });

    res.status(200).json(createResponse('success', {
      banner: formattedBanner,
      products: discountedProducts,
      currency: userCurrency
    }));

  } catch (error) {
    console.error('Get banner by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_banner')
    });
  }
};
