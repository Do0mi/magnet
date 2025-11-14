const mongoose = require('mongoose');
const Review = require('../models/review-model');

const normalizeId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  return null;
};

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(value);
};

const attachReviewCountsToProducts = async (products = [], options = {}) => {
  const { idSelector } = options;
  const collectedIds = products
    .map((product) => {
      if (!product) return null;
      if (idSelector) return idSelector(product);
      if (product._id) return product._id;
      if (product.id) return product.id;
      return null;
    })
    .filter(Boolean);

  const uniqueIds = [...new Set(collectedIds.map((id) => normalizeId(id)).filter(Boolean))];

  if (uniqueIds.length === 0) {
    products.forEach((product) => {
      if (product) product.reviewCount = 0;
    });
    return;
  }

  const counts = await Review.aggregate([
    {
      $match: {
        product: { $in: uniqueIds.map((id) => toObjectId(id)) },
        status: 'accept'
      }
    },
    {
      $group: {
        _id: '$product',
        count: { $sum: 1 }
      }
    }
  ]);

  const countMap = uniqueIds.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});

  counts.forEach(({ _id, count }) => {
    countMap[_id.toString()] = count;
  });

  products.forEach((product, index) => {
    if (!product) return;
    const rawId = collectedIds[index] || product._id || product.id;
    const normalized = normalizeId(rawId);
    product.reviewCount = countMap[normalized] || 0;
  });
};

module.exports = {
  attachReviewCountsToProducts
};

