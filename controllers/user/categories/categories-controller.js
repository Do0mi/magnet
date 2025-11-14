// User Categories Controller - Public category listings
const Category = require('../../../models/category-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatCategory } = require('../../../utils/response-formatters');

// GET /api/v1/user/categories - Get all allowed (active) categories
exports.getAllowedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' })
      .sort({ 'name.en': 1 })
      .lean();

    const formattedCategories = categories.map((category) =>
      formatCategory(category, { includeCreator: false })
    );

    return res.status(200).json(
      createResponse(
        'success',
        { categories: formattedCategories },
        getBilingualMessage('categories_retrieved')
      )
    );
  } catch (error) {
    console.error('Get allowed categories error:', error);
    return res
      .status(500)
      .json({ status: 'error', message: getBilingualMessage('failed_get_categories') });
  }
};

