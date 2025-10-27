// Dashboard Categories Controller - Admin/Employee Category Management
const Category = require('../../../models/category-model');
const Product = require('../../../models/product-model');
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

// GET /api/v1/dashboard/categories - Get all categories
exports.getCategories = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Category.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCategories: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_categories')
    });
  }
};

// GET /api/v1/dashboard/categories/:id - Get category by id
exports.getCategoryById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('category_not_found')
      });
    }

    res.status(200).json(createResponse('success', { category }));

  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_category')
    });
  }
};

// POST /api/v1/dashboard/categories/category - Create a category
exports.createCategory = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { name, description, imageUrl, parentCategory } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('category_name_required')
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('category_already_exists')
      });
    }

    // Check if parent category exists (if provided)
    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('parent_category_not_found')
        });
      }
    }

    const category = new Category({
      name,
      description,
      imageUrl,
      parentCategory
    });

    await category.save();

    res.status(201).json(createResponse('success', {
      category
    }, getBilingualMessage('category_created_success')));

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_category')
    });
  }
};

// PUT /api/v1/dashboard/categories/category/:id - Update a category
exports.updateCategory = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { name, description, imageUrl, parentCategory } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;
    if (parentCategory !== undefined) updateFields.parentCategory = parentCategory;

    // Check if category with same name already exists (excluding current category)
    if (name) {
      const existingCategory = await Category.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      if (existingCategory) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('category_already_exists')
        });
      }
    }

    // Check if parent category exists (if provided)
    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('parent_category_not_found')
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('category_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      category
    }, getBilingualMessage('category_updated_success')));

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_category')
    });
  }
};

// DELETE /api/v1/dashboard/categories/category/:id - Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    // Check if category has products
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('category_has_products')
      });
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({ parentCategory: req.params.id });
    if (subcategoriesCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('category_has_subcategories')
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('category_not_found')
      });
    }

    res.status(200).json(createResponse('success', null, getBilingualMessage('category_deleted_success')));

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_category')
    });
  }
};

// PUT /api/v1/dashboard/categories/category/:id/toggle - Toggle allow category
exports.toggleCategory = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('category_not_found')
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { isAllowed: !category.isAllowed },
      { new: true, runValidators: true }
    );

    res.status(200).json(createResponse('success', {
      category: updatedCategory
    }, getBilingualMessage('category_toggled_success')));

  } catch (error) {
    console.error('Toggle category error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_toggle_category')
    });
  }
};
