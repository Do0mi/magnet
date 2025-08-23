const Wishlist = require('../models/wishlist-model');
const Product = require('../models/product-model');
const { getBilingualMessage } = require('../utils/messages');
const { createResponse } = require('../utils/response-formatters');

// GET /wishlist
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('user', 'firstname lastname email role')
      .populate({
        path: 'products',
        populate: {
          path: 'owner',
          select: 'firstname lastname email businessInfo.companyName'
        }
      })
      .populate({
        path: 'products',
        populate: {
          path: 'approvedBy',
          select: 'firstname lastname email role'
        }
      });
    
    res.status(200).json(createResponse('success', { 
      wishlist: wishlist ? wishlist.products : [] 
    }));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_favourites') });
  }
};

// POST /wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId)
      .populate('owner', 'firstname lastname email businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');
    
    if (!product || product.status !== 'approved') {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found_or_not_approved') });
    }
    
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [productId] });
    } else {
      if (wishlist.products.includes(productId)) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('product_already_in_wishlist') });
      }
      wishlist.products.push(productId);
    }
    await wishlist.save();
    
    // Re-populate to get the updated wishlist with populated products
    const updatedWishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('user', 'firstname lastname email role')
      .populate({
        path: 'products',
        populate: {
          path: 'owner',
          select: 'firstname lastname email businessInfo.companyName'
        }
      })
      .populate({
        path: 'products',
        populate: {
          path: 'approvedBy',
          select: 'firstname lastname email role'
        }
      });
    
    res.status(200).json(createResponse('success', 
      { wishlist: updatedWishlist ? updatedWishlist.products : [] },
      getBilingualMessage('product_added_favourites')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_favourites') });
  }
};

// DELETE /wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('wishlist_not_found') });
    }
    wishlist.products = wishlist.products.filter(pid => pid.toString() !== productId);
    await wishlist.save();
    
    // Re-populate to get the updated wishlist with populated products
    const updatedWishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('user', 'firstname lastname email role')
      .populate({
        path: 'products',
        populate: {
          path: 'owner',
          select: 'firstname lastname email businessInfo.companyName'
        }
      })
      .populate({
        path: 'products',
        populate: {
          path: 'approvedBy',
          select: 'firstname lastname email role'
        }
      });
    
    res.status(200).json(createResponse('success', 
      { wishlist: updatedWishlist ? updatedWishlist.products : [] },
      getBilingualMessage('product_removed_favourites')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_remove_favourites') });
  }
}; 