// Dashboard Banners Controller - Admin/Employee Banner Management
const mongoose = require('mongoose');
const Banner = require('../../../models/banner-model');
const Product = require('../../../models/product-model');
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatBanner, formatProduct } = require('../../../utils/response-formatters');
const { convertCurrency, BASE_CURRENCY } = require('../../../services/currency-service');

// Magnet company name constant
const MAGNET_COMPANY_NAME = 'Magnet';

// Helper function to validate admin or magnet employee permissions with banners access
const validateBannersAccess = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }

  // For magnet_employee, check if they have access to banners page
  if (req.user.role === 'magnet_employee') {
    const user = await User.findById(req.user.id);
    if (!user || !user.accessPages || !user.accessPages.banners) {
      return res.status(403).json({ 
        status: 'error', 
        message: getBilingualMessage('banner_access_denied') 
      });
    }
  }

  return null;
};

// Helper function to calculate discounted price
const calculateDiscountedPrice = (originalPrice, percentage) => {
  const price = parseFloat(originalPrice);
  if (isNaN(price) || price <= 0) return originalPrice;
  const discount = price * (percentage / 100);
  return (price - discount).toFixed(2);
};

// Helper function to check if products are already in other banners
const checkProductsInBanners = async (productIds, excludeBannerId = null) => {
  const query = {
    products: { $in: productIds },
    isAllowed: true
  };
  
  // Exclude current banner when updating
  if (excludeBannerId) {
    query._id = { $ne: excludeBannerId };
  }
  
  const bannersWithProducts = await Banner.find(query).select('_id title products');
  
  // Find which products are already in banners
  const conflicts = [];
  productIds.forEach(productId => {
    const banner = bannersWithProducts.find(b => 
      b.products.some(p => p.toString() === productId.toString())
    );
    if (banner) {
      conflicts.push({
        productId: productId.toString(),
        bannerId: banner._id.toString(),
        bannerTitle: banner.title
      });
    }
  });
  
  return conflicts;
};

// POST /api/v1/dashboard/banners - Create banner
exports.createBanner = async (req, res) => {
  try {
    const permissionError = await validateBannersAccess(req, res);
    if (permissionError) return;

    const { title, description, imageUrl, percentage, products } = req.body;

    // Validate required fields
    if (!title || !title.en || !title.ar) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('banner_title_required_both_languages')
      });
    }

    if (!description || !description.en || !description.ar) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('banner_description_required_both_languages')
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('banner_image_url_required')
      });
    }

    if (percentage === undefined || percentage === null) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('banner_percentage_required')
      });
    }

    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('banner_percentage_invalid')
      });
    }

    // Validate products if provided
    if (products && Array.isArray(products) && products.length > 0) {
      const validProducts = await Product.find({
        _id: { $in: products },
        status: 'approved',
        isAllowed: true
      }).select('_id');

      if (validProducts.length !== products.length) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('banner_products_invalid')
        });
      }

      // Check if products are already in other banners
      const conflicts = await checkProductsInBanners(products);
      if (conflicts.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('banner_product_already_in_banner'),
          data: {
            conflicts: conflicts
          }
        });
      }
    }

    const banner = new Banner({
      title,
      description,
      imageUrl,
      percentage,
      products: products || [],
      owner: req.user.id, // Set owner to the admin/employee creating the banner
      isAllowed: true
    });

    await banner.save();
    
    // Update products to set isInBanner = true
    if (products && products.length > 0) {
      await Product.updateMany(
        { _id: { $in: products } },
        { isInBanner: true }
      );
    }
    
    await banner.populate('owner', 'firstname lastname email role businessInfo.companyName');

    // If owner is admin or magnet_employee, set magnet company name in businessInfo
    if (banner.owner && (banner.owner.role === 'admin' || banner.owner.role === 'magnet_employee')) {
      if (!banner.owner.businessInfo) {
        banner.owner.businessInfo = {};
      }
      banner.owner.businessInfo.companyName = MAGNET_COMPANY_NAME;
    }

    const formattedBanner = formatBanner(banner, { includeProducts: false });

    res.status(201).json(createResponse('success', {
      banner: formattedBanner
    }, getBilingualMessage('banner_created_success')));

  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_banner')
    });
  }
};

// GET /api/v1/dashboard/banners - Get all banners with products
exports.getBanners = async (req, res) => {
  try {
    const permissionError = await validateBannersAccess(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const banners = await Banner.find()
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Banner.countDocuments();

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Set Magnet company name for admin/employee created banners and get products with discounts
    const bannersWithProducts = await Promise.all(
      banners.map(async (banner) => {
        // Set Magnet company name
        if (banner.owner && (banner.owner.role === 'admin' || banner.owner.role === 'magnet_employee')) {
          if (!banner.owner.businessInfo) {
            banner.owner.businessInfo = {};
          }
          banner.owner.businessInfo.companyName = MAGNET_COMPANY_NAME;
        }

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

// GET /api/v1/dashboard/banners/:id - Get banner by id with discounted products
exports.getBannerById = async (req, res) => {
  try {
    const permissionError = await validateBannersAccess(req, res);
    if (permissionError) return;

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

    // If owner is admin or magnet_employee, set magnet company name in businessInfo
    if (banner.owner && (banner.owner.role === 'admin' || banner.owner.role === 'magnet_employee')) {
      if (!banner.owner.businessInfo) {
        banner.owner.businessInfo = {};
      }
      banner.owner.businessInfo.companyName = MAGNET_COMPANY_NAME;
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

// PUT /api/v1/dashboard/banners/:id - Update banner
exports.updateBanner = async (req, res) => {
  try {
    const permissionError = await validateBannersAccess(req, res);
    if (permissionError) return;

    // Validate that the ID parameter is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_banner_id')
      });
    }

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('banner_not_found')
      });
    }

    const { title, description, imageUrl, percentage, products } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (title) {
      if (!title.en || !title.ar) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('banner_title_required_both_languages')
        });
      }
      updateFields.title = title;
    }

    if (description) {
      if (!description.en || !description.ar) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('banner_description_required_both_languages')
        });
      }
      updateFields.description = description;
    }

    if (imageUrl !== undefined) {
      updateFields.imageUrl = imageUrl;
    }

    if (percentage !== undefined) {
      if (percentage < 0 || percentage > 100) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('banner_percentage_invalid')
        });
      }
      updateFields.percentage = percentage;
    }

    if (products !== undefined) {
      if (Array.isArray(products) && products.length > 0) {
        const validProducts = await Product.find({
          _id: { $in: products },
          status: 'approved',
          isAllowed: true
        }).select('_id');

        if (validProducts.length !== products.length) {
          return res.status(400).json({
            status: 'error',
            message: getBilingualMessage('banner_products_invalid')
          });
        }

        // Check if products are already in other banners (excluding current banner)
        const conflicts = await checkProductsInBanners(products, req.params.id);
        if (conflicts.length > 0) {
          return res.status(400).json({
            status: 'error',
            message: getBilingualMessage('banner_product_already_in_banner'),
            data: {
              conflicts: conflicts
            }
          });
        }
      }
      updateFields.products = products;
      
      // Update isInBanner field for products
      // Get old banner products to remove them from banner status
      const oldBannerData = await Banner.findById(req.params.id).select('products');
      
      if (oldBannerData) {
        const oldProducts = oldBannerData.products.map(p => p.toString());
        const newProducts = products.map(p => p.toString());
        
        // Products removed from banner - set isInBanner = false
        const removedProducts = oldProducts.filter(id => !newProducts.includes(id));
        if (removedProducts.length > 0) {
          await Product.updateMany(
            { _id: { $in: removedProducts } },
            { isInBanner: false }
          );
        }
        
        // Products added to banner - set isInBanner = true
        const addedProducts = newProducts.filter(id => !oldProducts.includes(id));
        if (addedProducts.length > 0) {
          await Product.updateMany(
            { _id: { $in: addedProducts } },
            { isInBanner: true }
          );
        }
      } else {
        // If old banner not found, just set new products to true
        await Product.updateMany(
          { _id: { $in: products } },
          { isInBanner: true }
        );
      }
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email role businessInfo.companyName');

    if (!updatedBanner) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('banner_not_found')
      });
    }

    // If owner is admin or magnet_employee, set magnet company name in businessInfo
    if (updatedBanner.owner && (updatedBanner.owner.role === 'admin' || updatedBanner.owner.role === 'magnet_employee')) {
      if (!updatedBanner.owner.businessInfo) {
        updatedBanner.owner.businessInfo = {};
      }
      updatedBanner.owner.businessInfo.companyName = MAGNET_COMPANY_NAME;
    }

    const formattedBanner = formatBanner(updatedBanner, { includeProducts: false });

    res.status(200).json(createResponse('success', {
      banner: formattedBanner
    }, getBilingualMessage('banner_updated_success')));

  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_banner')
    });
  }
};

// DELETE /api/v1/dashboard/banners/:id - Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const permissionError = await validateBannersAccess(req, res);
    if (permissionError) return;

    // Validate that the ID parameter is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_banner_id')
      });
    }

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('banner_not_found')
      });
    }

    // Update products to set isInBanner = false before deleting banner
    if (banner.products && banner.products.length > 0) {
      await Product.updateMany(
        { _id: { $in: banner.products } },
        { isInBanner: false }
      );
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json(createResponse('success', null, getBilingualMessage('banner_deleted_success')));

  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_banner')
    });
  }
};

// PUT /api/v1/dashboard/banners/:id/toggle - Toggle allow banner
exports.toggleBanner = async (req, res) => {
  try {
    const permissionError = await validateBannersAccess(req, res);
    if (permissionError) return;

    // Validate that the ID parameter is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_banner_id')
      });
    }

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('banner_not_found')
      });
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      { isAllowed: !banner.isAllowed },
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email role businessInfo.companyName');

    // If owner is admin or magnet_employee, set magnet company name in businessInfo
    if (updatedBanner.owner && (updatedBanner.owner.role === 'admin' || updatedBanner.owner.role === 'magnet_employee')) {
      if (!updatedBanner.owner.businessInfo) {
        updatedBanner.owner.businessInfo = {};
      }
      updatedBanner.owner.businessInfo.companyName = MAGNET_COMPANY_NAME;
    }

    const formattedBanner = formatBanner(updatedBanner, { includeProducts: false });

    res.status(200).json(createResponse('success', {
      banner: formattedBanner
    }, getBilingualMessage('banner_toggled_success')));

  } catch (error) {
    console.error('Toggle banner error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_toggle_banner')
    });
  }
};
