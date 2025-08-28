const Category = require('../models/category-model');
const { getBilingualMessage } = require('../utils/messages');
const { formatCategory, createResponse } = require('../utils/response-formatters');

// Legacy formatCategory function - now using the one from response-formatters
const legacyFormatCategory = (category, language = 'en') => {
  return formatCategory(category, { language });
};

// GET /categories
exports.getCategories = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const { status } = req.query;
    
    // Build query - by default show all categories (active and inactive)
    const query = {};
    if (status) {
      if (['active', 'inactive'].includes(status)) {
        // Handle bilingual status field - search in both English and Arabic
        query.$or = [
          { 'status.en': status },
          { 'status.ar': status === 'active' ? 'نشط' : 'غير نشط' }
        ];
      }
    }
    // If no status filter is provided, return all categories (no query filter)
    
    const categories = await Category.find(query)
      .populate('createdBy', 'firstname lastname email role');
    
    const formattedCategories = categories.map(category => formatCategory(category, { language }));
    
    res.status(200).json(createResponse('success', { categories: formattedCategories }));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_categories') });
  }
};

// POST /categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    
    // Validate bilingual fields
    if (!name || !name.en || !name.ar) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('category_name_required_both_languages') });
    }
    
    if (description && (!description.en || !description.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('category_description_required_both_languages') });
    }
    
    // Validate status if provided
    if (status) {
      if (!status.en || !status.ar) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('category_status_required_both_languages') });
      }
      if (!['active', 'inactive'].includes(status.en) || !['نشط', 'غير نشط'].includes(status.ar)) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_category_status') });
      }
    }
    
    const category = new Category({
      name,
      description,
      status: status || { en: 'inactive', ar: 'غير نشط' },
      createdBy: req.user.id
    });
    await category.save();
    
    // Re-populate to get the createdBy details
    const populatedCategory = await Category.findById(category._id)
      .populate('createdBy', 'firstname lastname email role');
    
    const language = req.query.lang || 'en';
    const formattedCategory = formatCategory(populatedCategory, { language });
    
    res.status(201).json(createResponse('success', 
      { category: formattedCategory },
      getBilingualMessage('category_created')
    ));
  } catch (err) {
    // Handle duplicate key error (unique constraint violation)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
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
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_create_category') });
  }
};

// PUT /categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'firstname lastname email role');
    if (!category) return res.status(404).json({ status: 'error', message: getBilingualMessage('category_not_found') });
    // Only creator, admin, or magnet_employee can update
    if (req.user.role === 'business' && category.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_update_category') });
    }
    
    const { name, description, status } = req.body;
    
    // Validate bilingual fields if provided
    if (name && (!name.en || !name.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('category_name_required_both_languages') });
    }
    
    if (description && (!description.en || !description.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('category_description_required_both_languages') });
    }
    
    // Validate status if provided
    if (status) {
      if (!status.en || !status.ar) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('category_status_required_both_languages') });
      }
      if (!['active', 'inactive'].includes(status.en) || !['نشط', 'غير نشط'].includes(status.ar)) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_category_status') });
      }
    }
    
    if (name) category.name = name;
    if (description) category.description = description;
    if (status) category.status = status;
    category.updatedAt = new Date();
    await category.save();
    
    // Re-populate to get the updated createdBy details
    const updatedCategory = await Category.findById(req.params.id)
      .populate('createdBy', 'firstname lastname email role');
    
    const language = req.query.lang || 'en';
    const formattedCategory = formatCategory(updatedCategory, { language });
    
    res.status(200).json(createResponse('success', 
      { category: formattedCategory },
      getBilingualMessage('category_updated')
    ));
  } catch (err) {
    // Handle duplicate key error (unique constraint violation)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
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
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_category') });
  }
};

// DELETE /categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'firstname lastname email role');
    if (!category) return res.status(404).json({ status: 'error', message: getBilingualMessage('category_not_found') });
    // Only creator, admin, or magnet_employee can delete
    if (req.user.role === 'business' && category.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_delete_category') });
    }
    await category.deleteOne();
    res.status(200).json(createResponse('success', null, getBilingualMessage('category_deleted')));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_category') });
  }
}; 