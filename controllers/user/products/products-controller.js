// User Products Controller - Public Product Access
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatProduct } = require('../../../utils/response-formatters');

// GET /api/v1/user/products - Get all approved and allowed products
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline = [];

    // Match stage for basic filters
    const matchStage = { status: 'approved' };
    if (category) matchStage.category = category;
    if (minPrice || maxPrice) {
      matchStage.price = {};
      if (minPrice) matchStage.price.$gte = parseFloat(minPrice);
      if (maxPrice) matchStage.price.$lte = parseFloat(maxPrice);
    }

    // If search is provided, we need to use aggregation to search across populated fields
    if (search) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerInfo'
        }
      });

      pipeline.push({
        $match: {
          ...matchStage,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } },
            { 'ownerInfo.firstname': { $regex: search, $options: 'i' } },
            { 'ownerInfo.lastname': { $regex: search, $options: 'i' } }
          ]
        }
      });

      // Add lookup for category
      pipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      });

      // Project to format the data similar to populate
      pipeline.push({
        $project: {
          name: 1,
          description: 1,
          price: 1,
          images: 1,
          specifications: 1,
          stock: 1,
          tags: 1,
          productCode: 1,
          status: 1,
          isAllowed: 1,
          createdAt: 1,
          updatedAt: 1,
          owner: {
            _id: { $arrayElemAt: ['$ownerInfo._id', 0] },
            firstname: { $arrayElemAt: ['$ownerInfo.firstname', 0] },
            lastname: { $arrayElemAt: ['$ownerInfo.lastname', 0] },
            businessName: { $arrayElemAt: ['$ownerInfo.businessInfo.companyName', 0] }
          },
          category: {
            _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
            name: { $arrayElemAt: ['$categoryInfo.name', 0] }
          }
        }
      });

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      pipeline.push({ $sort: sort });

      // Add pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });

      // Execute aggregation
      const products = await Product.aggregate(pipeline);

      // Get total count for pagination
      const countPipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'ownerInfo'
          }
        },
        {
          $match: {
            ...matchStage,
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { tags: { $in: [new RegExp(search, 'i')] } },
              { 'ownerInfo.firstname': { $regex: search, $options: 'i' } },
              { 'ownerInfo.lastname': { $regex: search, $options: 'i' } }
            ]
          }
        },
        { $count: 'total' }
      ];

      const countResult = await Product.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      const formattedProducts = products.map(product => formatProduct(product));

      res.status(200).json(createResponse('success', {
        products: formattedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          limit: parseInt(limit)
        }
      }));

    } else {
      // No search - use regular find with populate
      const filter = matchStage;

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

      const formattedProducts = products.map(product => formatProduct(product));

      res.status(200).json(createResponse('success', {
        products: formattedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          limit: parseInt(limit)
        }
      }));
    }

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

    const formattedProduct = formatProduct(product);

    res.status(200).json(createResponse('success', { product: formattedProduct }));

  } catch (error) {
    console.error('Get public product by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_product')
    });
  }
};

