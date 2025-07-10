const Category = require('../models/category-model');

// GET /categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get categories' });
  }
};

// POST /categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({
      name,
      description,
      createdBy: req.user.id
    });
    await category.save();
    res.status(201).json({ status: 'success', message: 'Category created', data: { category } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to create category' });
  }
};

// PUT /categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ status: 'error', message: 'Category not found' });
    // Only creator, admin, or magnet_employee can update
    if (req.user.role === 'business' && category.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to update this category' });
    }
    const { name, description } = req.body;
    if (name) category.name = name;
    if (description) category.description = description;
    category.updatedAt = new Date();
    await category.save();
    res.status(200).json({ status: 'success', message: 'Category updated', data: { category } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update category' });
  }
};

// DELETE /categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ status: 'error', message: 'Category not found' });
    // Only creator, admin, or magnet_employee can delete
    if (req.user.role === 'business' && category.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to delete this category' });
    }
    await category.deleteOne();
    res.status(200).json({ status: 'success', message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to delete category' });
  }
}; 