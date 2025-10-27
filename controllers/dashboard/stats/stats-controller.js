// Dashboard Stats Controller - Admin/Employee Statistics Management
const User = require('../../../models/user-model');
const Product = require('../../../models/product-model');
const Order = require('../../../models/order-model');
const Review = require('../../../models/review-model');
const Wishlist = require('../../../models/wishlist-model');
const Address = require('../../../models/address-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

// Helper function to validate admin or magnet employee permissions
const validateAdminOrEmployeePermissions = (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// GET /api/v1/dashboard/stats/users - Get user statistics (Admin/Employee)
exports.getUserStats = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: 'customer' });
    const businesses = await User.countDocuments({ role: 'business' });
    const admins = await User.countDocuments({ role: 'admin' });
    const employees = await User.countDocuments({ role: 'magnet_employee' });
    const allowedUsers = await User.countDocuments({ isAllowed: true });
    const disallowedUsers = await User.countDocuments({ isAllowed: false });

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.status(200).json(createResponse('success', {
      totalUsers,
      customers,
      businesses,
      admins,
      employees,
      allowedUsers,
      disallowedUsers,
      recentUsers
    }));

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_stats')
    });
  }
};

// GET /api/v1/dashboard/stats/orders - Get order statistics (Admin/Employee)
exports.getOrderStats = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const refundedOrders = await Order.countDocuments({ status: 'refunded' });

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.status(200).json(createResponse('success', {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
      totalRevenue,
      recentOrders
    }));

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_stats')
    });
  }
};

// GET /api/v1/dashboard/stats/products - Get product statistics (Admin/Employee)
exports.getProductStats = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const totalProducts = await Product.countDocuments();
    const approvedProducts = await Product.countDocuments({ status: 'approved' });
    const pendingProducts = await Product.countDocuments({ status: 'pending' });
    const declinedProducts = await Product.countDocuments({ status: 'declined' });

    // Calculate average price
    const priceResult = await Product.aggregate([
      { $group: { _id: null, averagePrice: { $avg: '$price' } } }
    ]);
    const averagePrice = priceResult.length > 0 ? priceResult[0].averagePrice : 0;

    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $project: { categoryName: '$categoryInfo.name', count: 1 } }
    ]);

    // Get recent products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentProducts = await Product.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.status(200).json(createResponse('success', {
      totalProducts,
      approvedProducts,
      pendingProducts,
      declinedProducts,
      averagePrice,
      productsByCategory,
      recentProducts
    }));

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_stats')
    });
  }
};

// GET /api/v1/dashboard/stats/reviews - Get review statistics (Admin/Employee)
exports.getReviewStats = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ status: 'approved' });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    const rejectedReviews = await Review.countDocuments({ status: 'rejected' });

    // Calculate average rating
    const ratingResult = await Review.aggregate([
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratingResult.length > 0 ? ratingResult[0].averageRating : 0;

    // Get reviews by rating
    const reviewsByRating = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get recent reviews (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = await Review.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.status(200).json(createResponse('success', {
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      averageRating,
      reviewsByRating,
      recentReviews
    }));

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_stats')
    });
  }
};

// GET /api/v1/dashboard/stats/general - Get general statistics (Admin/Employee)
exports.getGeneralStats = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    // Get all basic counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalWishlists = await Wishlist.countDocuments();
    const totalAddresses = await Address.countDocuments();

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentProducts = await Product.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentOrders = await Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentReviews = await Review.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json(createResponse('success', {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalReviews,
        totalWishlists,
        totalAddresses,
        totalRevenue
      },
      recentActivity: {
        recentUsers,
        recentProducts,
        recentOrders,
        recentReviews
      }
    }));

  } catch (error) {
    console.error('Get general stats error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_stats')
    });
  }
};
