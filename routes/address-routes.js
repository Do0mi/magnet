const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/address-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireCustomer } = require('../middleware/role-middleware');

// GET /addresses (Customer only)
router.get('/', verifyToken, requireCustomer, AddressController.getAddresses);
// POST /addresses (Customer only)
router.post('/', verifyToken, requireCustomer, AddressController.addAddress);
// PUT /addresses/:id (Customer only)
router.put('/:id', verifyToken, requireCustomer, AddressController.updateAddress);
// DELETE /addresses/:id (Customer only)
router.delete('/:id', verifyToken, requireCustomer, AddressController.deleteAddress);

module.exports = router; 