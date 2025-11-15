// User Cart Controller - Customer cart management
const mongoose = require('mongoose');
const Cart = require('../../../models/cart-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatProduct } = require('../../../utils/response-formatters');
const { attachReviewCountsToProducts } = require('../../../utils/review-helpers');

const CART_PRODUCT_FIELDS = [
  'code',
  'name',
  'description',
  'images',
  'pricePerUnit',
  'stock',
  'status',
  'minOrder',
  'unit',
  'category',
  'customFields',
  'attachments',
  'isAllowed',
  'declinedReason',
  'owner',
  'approvedBy',
  'rating',
  'createdAt',
  'updatedAt'
].join(' ');

const populateCartProducts = async (cart) => {
  if (!cart) return cart;
  await cart.populate({
    path: 'items.product',
    select: CART_PRODUCT_FIELDS,
    populate: [
      {
        path: 'owner',
        select: 'firstname lastname email role businessInfo.companyName businessInfo.companyType'
      },
      {
        path: 'approvedBy',
        select: 'firstname lastname email role'
      }
    ]
  });
  const products = cart.items
    .map((item) => item.product)
    .filter((product) => product && typeof product === 'object');
  if (products.length > 0) {
    await attachReviewCountsToProducts(products);
  }
  return cart;
};

const formatCartResponse = (cart) => {
  if (!cart) return null;

  return {
    id: cart._id,
    user: cart.user,
    currency: cart.currency,
    subtotal: cart.subtotal,
    totalItems: cart.totalItems,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: cart.items.map((item) => ({
      id: item._id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      product:
        item.product && typeof item.product === 'object'
          ? formatProduct(item.product)
          : item.product
    }))
  };
};

const ensureCartExists = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
    await cart.save();
  }
  await populateCartProducts(cart);
  return cart;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/v1/user/cart - Get customer's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await ensureCartExists(req.user.id);

    return res.status(200).json(
      createResponse(
        'success',
        { cart: formatCartResponse(cart) },
        getBilingualMessage('cart_retrieved')
      )
    );
  } catch (error) {
    console.error('Get cart error:', error);
    return res
      .status(500)
      .json({ status: 'error', message: getBilingualMessage('failed_get_cart') });
  }
};

// PUT /api/v1/user/cart - Replace cart items for customer
exports.updateCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res
        .status(400)
        .json({ status: 'error', message: getBilingualMessage('items_required') });
    }

    const aggregatedItems = new Map();

    for (const rawItem of items) {
      const { productId, quantity } = rawItem || {};

      if (!productId || !isValidObjectId(productId)) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('invalid_cart_product')
        });
      }

      const parsedQuantity = Number(quantity);

      if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1 || !Number.isInteger(parsedQuantity)) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('invalid_cart_quantity')
        });
      }

      if (!aggregatedItems.has(productId)) {
        aggregatedItems.set(productId, { quantity: 0 });
      }

      const current = aggregatedItems.get(productId);
      current.quantity += parsedQuantity;
    }

    const validatedItems = [];

    for (const [productId, payload] of aggregatedItems.entries()) {
      const product = await Product.findById(productId);

      if (!product) {
        return res
          .status(404)
          .json({ status: 'error', message: getBilingualMessage('product_not_found') });
      }

      if (product.status !== 'approved' || !product.isAllowed) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('product_not_available')
        });
      }

      if (typeof product.stock === 'number' && product.stock < payload.quantity) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('insufficient_stock')
        });
      }

      const unitPrice = parseFloat(product.pricePerUnit);

      if (Number.isNaN(unitPrice) || unitPrice <= 0) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('invalid_product_price')
        });
      }

      validatedItems.push({
        product: product._id,
        quantity: payload.quantity,
        unitPrice,
        totalPrice: unitPrice * payload.quantity
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id });
    }

    cart.items = validatedItems;
    await cart.save();
    await populateCartProducts(cart);

    return res.status(200).json(
      createResponse(
        'success',
        { cart: formatCartResponse(cart) },
        getBilingualMessage('cart_updated')
      )
    );
  } catch (error) {
    console.error('Update cart error:', error);
    return res
      .status(500)
      .json({ status: 'error', message: getBilingualMessage('failed_update_cart') });
  }
};

