const express = require('express');
const router = express.Router();
const CategoriesController = require('../../../controllers/user/categories/categories-controller');

// Public route: list all allowed categories
// GET /api/v1/user/categories
router.get('/', CategoriesController.getAllowedCategories);

module.exports = router;

