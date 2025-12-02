// Dashboard Controller - Comprehensive Stats and Analytics
const User = require('../../../models/user-model');
const Product = require('../../../models/product-model');
const Order = require('../../../models/order-model');
const Review = require('../../../models/review-model');
const Wishlist = require('../../../models/wishlist-model');
const Address = require('../../../models/address-model');
const Category = require('../../../models/category-model');
const SpecialOrder = require('../../../models/special-order-model');
const Applicant = require('../../../models/applicant-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

// Base currency for dashboard (always USD)
const BASE_CURRENCY = 'USD';

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

// GET /api/v1/dashboard/dashboard - Get comprehensive dashboard overview
exports.getDashboard = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // ========== USERS STATISTICS ==========
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: 'customer' });
    const businesses = await User.countDocuments({ role: 'business' });
    const admins = await User.countDocuments({ role: 'admin' });
    const employees = await User.countDocuments({ role: 'magnet_employee' });
    const allowedUsers = await User.countDocuments({ isAllowed: true });
    const disallowedUsers = await User.countDocuments({ isAllowed: false });
    const pendingBusinesses = await User.countDocuments({ 
      role: 'business', 
      'businessInfo.approvalStatus': 'pending' 
    });
    const approvedBusinesses = await User.countDocuments({ 
      role: 'business', 
      'businessInfo.approvalStatus': 'approved' 
    });
    const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const todayUsers = await User.countDocuments({ createdAt: { $gte: today } });

    // ========== PRODUCTS STATISTICS ==========
    const totalProducts = await Product.countDocuments();
    const approvedProducts = await Product.countDocuments({ status: 'approved', isAllowed: true });
    const pendingProducts = await Product.countDocuments({ status: 'pending' });
    const declinedProducts = await Product.countDocuments({ status: 'declined' });
    const allowedProducts = await Product.countDocuments({ isAllowed: true });
    const disallowedProducts = await Product.countDocuments({ isAllowed: false });
    
    // Calculate average price
    const priceResult = await Product.aggregate([
      { $group: { _id: null, averagePrice: { $avg: '$pricePerUnit' }, minPrice: { $min: '$pricePerUnit' }, maxPrice: { $max: '$pricePerUnit' } } }
    ]);
    const averagePrice = priceResult.length > 0 ? priceResult[0].averagePrice : 0;
    const minPrice = priceResult.length > 0 ? priceResult[0].minPrice : 0;
    const maxPrice = priceResult.length > 0 ? priceResult[0].maxPrice : 0;

    // Total stock
    const stockResult = await Product.aggregate([
      { $group: { _id: null, totalStock: { $sum: '$stock' } } }
    ]);
    const totalStock = stockResult.length > 0 ? stockResult[0].totalStock : 0;

    const recentProducts = await Product.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const todayProducts = await Product.countDocuments({ createdAt: { $gte: today } });

    // ========== ORDERS STATISTICS ==========
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const refundedOrders = await Order.countDocuments({ status: 'refunded' });

    // Calculate revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, averageOrderValue: { $avg: '$total' }, orderCount: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const averageOrderValue = revenueResult.length > 0 ? revenueResult[0].averageOrderValue : 0;

    // Revenue today
    const todayRevenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] }, createdAt: { $gte: today } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].totalRevenue : 0;

    // Revenue last 7 days
    const weekRevenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] }, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const weekRevenue = weekRevenueResult.length > 0 ? weekRevenueResult[0].totalRevenue : 0;

    // Revenue last 30 days
    const monthRevenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const monthRevenue = monthRevenueResult.length > 0 ? monthRevenueResult[0].totalRevenue : 0;

    const recentOrders = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });

    // ========== REVIEWS STATISTICS ==========
    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ status: 'approved' });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    const rejectedReviews = await Review.countDocuments({ status: 'reject' });

    // Calculate average rating
    const ratingResult = await Review.aggregate([
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratingResult.length > 0 ? ratingResult[0].averageRating : 0;

    // Reviews by rating
    const reviewsByRating = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const recentReviews = await Review.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const todayReviews = await Review.countDocuments({ createdAt: { $gte: today } });

    // ========== CATEGORIES STATISTICS ==========
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ status: 'active' });
    const inactiveCategories = await Category.countDocuments({ status: 'inactive' });

    // ========== WISHLISTS STATISTICS ==========
    const totalWishlists = await Wishlist.countDocuments();
    const wishlistsWithProducts = await Wishlist.countDocuments({ products: { $exists: true, $ne: [] } });
    const emptyWishlists = await Wishlist.countDocuments({ products: { $size: 0 } });

    // ========== ADDRESSES STATISTICS ==========
    const totalAddresses = await Address.countDocuments();
    const defaultAddresses = await Address.countDocuments({ isDefault: true });

    // ========== SPECIAL ORDERS STATISTICS ==========
    const totalSpecialOrders = await SpecialOrder.countDocuments();
    const pendingSpecialOrders = await SpecialOrder.countDocuments({ status: 'pending' });
    const reviewedSpecialOrders = await SpecialOrder.countDocuments({ status: 'reviewed' });
    const contactedSpecialOrders = await SpecialOrder.countDocuments({ status: 'contacted' });
    const completedSpecialOrders = await SpecialOrder.countDocuments({ status: 'completed' });
    const cancelledSpecialOrders = await SpecialOrder.countDocuments({ status: 'cancelled' });
    const recentSpecialOrders = await SpecialOrder.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // ========== APPLICANTS STATISTICS ==========
    const totalApplicants = await Applicant.countDocuments();
    const pendingApplicants = await Applicant.countDocuments({ status: 'pending' });
    const acceptedApplicants = await Applicant.countDocuments({ status: 'accepted' });
    const rejectedApplicants = await Applicant.countDocuments({ status: 'rejected' });
    const applicantsWithCV = await Applicant.countDocuments({ has_cv: true });
    const recentApplicants = await Applicant.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // ========== RECENT ACTIVITY (Last 7 Days) ==========
    const recentActivity = {
      users: await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      products: await Product.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      orders: await Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      reviews: await Review.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      specialOrders: await SpecialOrder.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      applicants: await Applicant.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    };

    // ========== TODAY'S ACTIVITY ==========
    const todayActivity = {
      users: todayUsers,
      products: todayProducts,
      orders: todayOrders,
      reviews: todayReviews,
      revenue: todayRevenue
    };

    res.status(200).json(createResponse('success', {
      overview: {
        users: {
          total: totalUsers,
          customers,
          businesses,
          admins,
          employees,
          allowed: allowedUsers,
          disallowed: disallowedUsers,
          pendingBusinesses,
          approvedBusinesses,
          recent: recentUsers,
          today: todayUsers
        },
        products: {
          total: totalProducts,
          approved: approvedProducts,
          pending: pendingProducts,
          declined: declinedProducts,
          allowed: allowedProducts,
          disallowed: disallowedProducts,
          averagePrice: parseFloat(averagePrice.toFixed(2)),
          minPrice: parseFloat(minPrice.toFixed(2)),
          maxPrice: parseFloat(maxPrice.toFixed(2)),
          totalStock,
          recent: recentProducts,
          today: todayProducts
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          refunded: refundedOrders,
          recent: recentOrders,
          today: todayOrders
        },
        revenue: {
          total: parseFloat(totalRevenue.toFixed(2)),
          today: parseFloat(todayRevenue.toFixed(2)),
          week: parseFloat(weekRevenue.toFixed(2)),
          month: parseFloat(monthRevenue.toFixed(2)),
          averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
        },
        reviews: {
          total: totalReviews,
          approved: approvedReviews,
          pending: pendingReviews,
          rejected: rejectedReviews,
          averageRating: parseFloat(averageRating.toFixed(2)),
          reviewsByRating,
          recent: recentReviews,
          today: todayReviews
        },
        categories: {
          total: totalCategories,
          active: activeCategories,
          inactive: inactiveCategories
        },
        wishlists: {
          total: totalWishlists,
          withProducts: wishlistsWithProducts,
          empty: emptyWishlists
        },
        addresses: {
          total: totalAddresses,
          default: defaultAddresses
        },
        specialOrders: {
          total: totalSpecialOrders,
          pending: pendingSpecialOrders,
          reviewed: reviewedSpecialOrders,
          contacted: contactedSpecialOrders,
          completed: completedSpecialOrders,
          cancelled: cancelledSpecialOrders,
          recent: recentSpecialOrders
        },
        applicants: {
          total: totalApplicants,
          pending: pendingApplicants,
          accepted: acceptedApplicants,
          rejected: rejectedApplicants,
          withCV: applicantsWithCV,
          recent: recentApplicants
        }
      },
      recentActivity,
      todayActivity,
      currency: BASE_CURRENCY,
      generatedAt: new Date()
    }));

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_dashboard')
    });
  }
};

// GET /api/v1/dashboard/analytics - Get detailed analytics data
exports.getAnalytics = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { period = '30' } = req.query; // period in days: 7, 30, 90, 365
    const periodDays = parseInt(period);
    const validPeriods = [7, 30, 90, 365];
    const finalPeriod = validPeriods.includes(periodDays) ? periodDays : 30;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - finalPeriod);

    // ========== USER ANALYTICS ==========
    // User growth over time
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Business approval status distribution
    const businessStatusDistribution = await User.aggregate([
      { $match: { role: 'business' } },
      { $group: { _id: '$businessInfo.approvalStatus', count: { $sum: 1 } } }
    ]);

    // ========== PRODUCT ANALYTICS ==========
    // Product growth over time
    const productGrowth = await Product.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Products by status
    const productsByStatus = await Product.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Products by category
    const productsByCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $project: { categoryName: '$categoryInfo.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Price distribution
    const priceDistribution = await Product.aggregate([
      {
        $bucket: {
          groupBy: '$pricePerUnit',
          boundaries: [0, 50, 100, 200, 500, 1000, 5000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgPrice: { $avg: '$pricePerUnit' }
          }
        }
      }
    ]);

    // ========== ORDER ANALYTICS ==========
    // Order growth over time
    const orderGrowth = await Order.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalRevenue: { $sum: '$total' } } }
    ]);

    // Revenue over time
    const revenueOverTime = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] }, createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Average order value by status
    const avgOrderValueByStatus = await Order.aggregate([
      { $group: { _id: '$status', avgValue: { $avg: '$total' }, count: { $sum: 1 } } }
    ]);

    // Top customers by order count
    const topCustomers = await Order.aggregate([
      { $group: { _id: '$customer', orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' },
      {
        $project: {
          customerId: '$_id',
          customerName: { $concat: ['$customerInfo.firstname', ' ', '$customerInfo.lastname'] },
          customerEmail: '$customerInfo.email',
          orderCount: 1,
          totalSpent: { $round: ['$totalSpent', 2] }
        }
      }
    ]);

    // ========== REVIEW ANALYTICS ==========
    // Review growth over time
    const reviewGrowth = await Review.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Reviews by status
    const reviewsByStatus = await Review.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Average rating over time
    const ratingOverTime = await Review.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // ========== SPECIAL ORDER ANALYTICS ==========
    // Special orders over time
    const specialOrderGrowth = await SpecialOrder.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Special orders by status
    const specialOrdersByStatus = await SpecialOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // ========== APPLICANT ANALYTICS ==========
    // Applicants over time
    const applicantGrowth = await Applicant.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Applicants by status
    const applicantsByStatus = await Applicant.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Applicants by gender
    const applicantsByGender = await Applicant.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // ========== GET COUNTS FOR PERFORMANCE METRICS ==========
    const totalOrders = await Order.countDocuments();
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    
    const totalProducts = await Product.countDocuments();
    const approvedProducts = await Product.countDocuments({ status: 'approved', isAllowed: true });
    
    const businesses = await User.countDocuments({ role: 'business' });
    const approvedBusinesses = await User.countDocuments({ 
      role: 'business', 
      'businessInfo.approvalStatus': 'approved' 
    });
    
    const totalReviews = await Review.countDocuments();
    const approvedReviews = await Review.countDocuments({ status: 'approved' });

    // ========== PERFORMANCE METRICS ==========
    // Conversion rates
    const totalOrderAttempts = totalOrders + cancelledOrders;
    const orderConversionRate = totalOrderAttempts > 0 
      ? parseFloat(((deliveredOrders / totalOrderAttempts) * 100).toFixed(2))
      : 0;

    // Product approval rate
    const productApprovalRate = totalProducts > 0
      ? parseFloat(((approvedProducts / totalProducts) * 100).toFixed(2))
      : 0;

    // Business approval rate
    const businessApprovalRate = businesses > 0
      ? parseFloat(((approvedBusinesses / businesses) * 100).toFixed(2))
      : 0;

    // Review approval rate
    const reviewApprovalRate = totalReviews > 0
      ? parseFloat(((approvedReviews / totalReviews) * 100).toFixed(2))
      : 0;

    res.status(200).json(createResponse('success', {
      period: finalPeriod,
      periodStart,
      periodEnd: today,
      users: {
        growth: userGrowth,
        byRole: usersByRole,
        businessStatusDistribution
      },
      products: {
        growth: productGrowth,
        byStatus: productsByStatus,
        byCategory: productsByCategory,
        priceDistribution
      },
      orders: {
        growth: orderGrowth,
        byStatus: ordersByStatus,
        revenueOverTime,
        avgOrderValueByStatus: avgOrderValueByStatus.map(item => ({
          status: item._id,
          avgValue: parseFloat(item.avgValue.toFixed(2)),
          count: item.count
        })),
        topCustomers
      },
      reviews: {
        growth: reviewGrowth,
        byStatus: reviewsByStatus,
        ratingOverTime: ratingOverTime.map(item => ({
          date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
          avgRating: parseFloat(item.avgRating.toFixed(2)),
          count: item.count
        }))
      },
      specialOrders: {
        growth: specialOrderGrowth,
        byStatus: specialOrdersByStatus
      },
      applicants: {
        growth: applicantGrowth,
        byStatus: applicantsByStatus,
        byGender: applicantsByGender
      },
      metrics: {
        orderConversionRate,
        productApprovalRate,
        businessApprovalRate,
        reviewApprovalRate
      },
      currency: BASE_CURRENCY,
      generatedAt: new Date()
    }));

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_analytics')
    });
  }
};

