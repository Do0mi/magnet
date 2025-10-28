const Product = require('../models/product-model');

async function generateProductCode() {
  let code;
  let isUnique = false;
  
  // Keep generating until we get a unique code
  while (!isUnique) {
    // Generate random alphabet letter (A-Z)
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    
    // Generate random 2-digit number (00-99)
    const randomNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    code = `${randomLetter}${randomNumber}`;
    
    // Check if this code already exists
    const existingProduct = await Product.findOne({ code });
    if (!existingProduct) {
      isUnique = true;
    }
  }
  
  return code;
}

module.exports = generateProductCode; 