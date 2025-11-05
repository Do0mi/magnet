// User Wishlists Controller - User Wishlist Management
const Wishlist = require('../../../models/wishlist-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

// Helper function to validate customer or business permissions
const validateCustomerPermissions = (req, res) => {
  if (req.user.role !== 'customer' && req.user.role !== 'business') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// GET /api/v1/user/wishlists - Get user wishlist (Customer or Business)
exports.getWishlist = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name price images description stock status');

    if (!wishlist) {
      // Create empty wishlist if it doesn't exist
      wishlist = new Wishlist({
        user: req.user.id,
        products: []
      });
      await wishlist.save();
    }

    // Filter out products that are no longer available
    const availableProducts = wishlist.products.filter(product => 
      product.status === 'approved' && product.stock > 0
    );

    // Update wishlist if some products were filtered out
    if (availableProducts.length !== wishlist.products.length) {
      wishlist.products = availableProducts.map(p => p._id);
      await wishlist.save();
    }

    res.status(200).json(createResponse('success', { 
      wishlist: {
        _id: wishlist._id,
        products: availableProducts
      }
    }));

  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_wishlist')
    });
  }
};

// PUT /api/v1/user/wishlist - Add product if not exists in the wishlist, remove product if exist
exports.toggleWishlist = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('product_id_required')
      });
    }

    // Check if product exists and is approved
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    if (product.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('product_not_available')
      });
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user.id,
        products: []
      });
    }

    // Check if product is already in wishlist
    const productIndex = wishlist.products.findIndex(id => id.toString() === productId);
    
    if (productIndex !== -1) {
      // Product exists in wishlist, remove it
      wishlist.products.splice(productIndex, 1);
      await wishlist.save();
      
      await wishlist.populate('products', 'name price images description stock status');
      
      res.status(200).json(createResponse('success', {
        wishlist,
        action: 'removed'
      }, getBilingualMessage('product_removed_from_wishlist_success')));
    } else {
      // Product doesn't exist in wishlist, add it
      wishlist.products.push(productId);
      await wishlist.save();
      
      await wishlist.populate('products', 'name price images description stock status');
      
      res.status(200).json(createResponse('success', {
        wishlist,
        action: 'added'
      }, getBilingualMessage('product_added_to_wishlist_success')));
    }

  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_toggle_wishlist')
    });
  }
};
