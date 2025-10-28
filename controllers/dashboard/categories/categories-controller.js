// Dashboard Categories Controller - Admin/Employee Category Management
const Category = require('../../../models/category-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatCategory } = require('../../../utils/response-formatters');

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

    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.ar': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
        { 'description.ar': { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      if (['active', 'inactive'].includes(status)) {
        filter.status = status;
      }
    }

    const categories = await Category.find(filter)
      .populate('createdBy', 'firstname lastname email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Category.countDocuments(filter);

    const formattedCategories = categories.map(category => formatCategory(category));

    res.status(200).json(createResponse('success', {
      categories: formattedCategories,
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

    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'firstname lastname email role');

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('category_not_found')
      });
    }

    const formattedCategory = formatCategory(category);

    res.status(200).json(createResponse('success', { category: formattedCategory }));

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

    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    const { name, description, status } = req.body;

    // Validate bilingual fields
    if (!name || !name.en || !name.ar) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('category_name_required_both_languages') 
      });
    }

    if (description && (!description.en || !description.ar)) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('category_description_required_both_languages') 
      });
    }

    // Validate status if provided
    if (status) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('invalid_category_status') 
        });
      }
    }

    const category = new Category({
      name,
      description,
      status: status || 'inactive',
      createdBy: req.user.id
    });

    await category.save();

    // Re-populate to get the createdBy details
    const populatedCategory = await Category.findById(category._id)
      .populate('createdBy', 'firstname lastname email role');

    const formattedCategory = formatCategory(populatedCategory);

    res.status(201).json(createResponse('success', {
      category: formattedCategory
    }, getBilingualMessage('category_created_success')));

  } catch (error) {
    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'name.en') {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('category_name_en_already_exists') || 'Category name in English already exists'
        });
      } else if (field === 'name.ar') {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('category_name_ar_already_exists') || 'Category name in Arabic already exists'
        });
      }
    }
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

    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    const { name, description, status } = req.body;

    // Validate bilingual fields if provided
    if (name && (!name.en || !name.ar)) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('category_name_required_both_languages') 
      });
    }

    if (description && (!description.en || !description.ar)) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('category_description_required_both_languages') 
      });
    }

    // Validate status if provided
    if (status) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('invalid_category_status') 
        });
      }
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('category_not_found')
      });
    }

    if (name) category.name = name;
    if (description) category.description = description;
    if (status) category.status = status;
    category.updatedAt = new Date();
    await category.save();

    // Re-populate to get the updated createdBy details
    const updatedCategory = await Category.findById(req.params.id)
      .populate('createdBy', 'firstname lastname email role');

    const formattedCategory = formatCategory(updatedCategory);

    res.status(200).json(createResponse('success', {
      category: formattedCategory
    }, getBilingualMessage('category_updated_success')));

  } catch (error) {
    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'name.en') {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('category_name_en_already_exists') || 'Category name in English already exists'
        });
      } else if (field === 'name.ar') {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('category_name_ar_already_exists') || 'Category name in Arabic already exists'
        });
      }
    }
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

// PUT /api/v1/dashboard/categories/category/:id/toggle - Toggle category status
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

    // Toggle between 'active' and 'inactive'
    const newStatus = category.status === 'active' ? 'inactive' : 'active';

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstname lastname email role');

    const formattedCategory = formatCategory(updatedCategory);

    res.status(200).json(createResponse('success', {
      category: formattedCategory
    }, getBilingualMessage('category_toggled_success')));

  } catch (error) {
    console.error('Toggle category error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_toggle_category')
    });
  }
};
