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
    const categories = await Category.find();
    
    const formattedCategories = categories.map(category => formatCategory(category, { language }));
    
    res.status(200).json(createResponse('success', { categories: formattedCategories }));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_categories') });
  }
};

// POST /categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validate bilingual fields
    if (!name || !name.en || !name.ar) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('category_name_required_both_languages') });
    }
    
    if (description && (!description.en || !description.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('category_description_required_both_languages') });
    }
    
    const category = new Category({
      name,
      description,
      createdBy: req.user.id
    });
    await category.save();
    
    const language = req.query.lang || 'en';
    const formattedCategory = formatCategory(category, { language });
    
    res.status(201).json(createResponse('success', 
      { category: formattedCategory },
      getBilingualMessage('category_created')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_create_category') });
  }
};

// PUT /categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ status: 'error', message: getBilingualMessage('category_not_found') });
    // Only creator, admin, or magnet_employee can update
    if (req.user.role === 'business' && category.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_update_category') });
    }
    
    const { name, description } = req.body;
    
    // Validate bilingual fields if provided
    if (name && (!name.en || !name.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('category_name_required_both_languages') });
    }
    
    if (description && (!description.en || !description.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('category_description_required_both_languages') });
    }
    
    if (name) category.name = name;
    if (description) category.description = description;
    category.updatedAt = new Date();
    await category.save();
    
    const language = req.query.lang || 'en';
    const formattedCategory = formatCategory(category, { language });
    
    res.status(200).json(createResponse('success', 
      { category: formattedCategory },
      getBilingualMessage('category_updated')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_category') });
  }
};

// DELETE /categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ status: 'error', message: getBilingualMessage('category_not_found') });
    // Only creator, admin, or magnet_employee can delete
    if (req.user.role === 'business' && category.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_delete_category') });
    }
    await category.deleteOne();
    res.status(200).json(createResponse('success', null, getBilingualMessage('category_deleted')));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_category') });
  }
}; 