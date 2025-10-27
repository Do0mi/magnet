// User Products Controller - Public Product Access
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

// GET /api/v1/user/products - Get all approved and allowed products
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object - only approved products
    const filter = { status: 'approved' };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .populate('owner', 'firstname lastname businessName')
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get public products error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_products')
    });
  }
};

// GET /api/v1/user/products/:id - Get product by id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      status: 'approved' 
    })
      .populate('owner', 'firstname lastname businessName')
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    res.status(200).json(createResponse('success', { product }));

  } catch (error) {
    console.error('Get public product by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_product')
    });
  }
};

