const Product = require('../models/product-model');

async function generateProductCode() {
  const lastProduct = await Product.findOne().sort({ createdAt: -1 }).select('code');
  if (!lastProduct || !/^A\d{3}$/.test(lastProduct.code)) {
    return 'A001';
  }
  const lastNumber = parseInt(lastProduct.code.slice(1));
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `A${nextNumber}`;
}

module.exports = generateProductCode; 