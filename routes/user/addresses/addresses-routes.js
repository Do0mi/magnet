const express = require('express');
const router = express.Router();
const AddressController = require('../../../controllers/user/addresses/addresses-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireCustomer } = require('../../../middleware/role-middleware');

// All user address routes require authentication
router.use(verifyToken);

// GET /api/v1/user/addresses - Get all customer's addresses
router.get('/', requireCustomer, AddressController.getAddresses);

// GET /api/v1/user/addresses/:id - Get a specific customer's address
router.get('/:id', requireCustomer, AddressController.getAddressById);

// POST /api/v1/user/addresses/address - Create a new address
router.post('/address', requireCustomer, AddressController.createAddress);

// PUT /api/v1/user/addresses/address/:id - Update an existing address
router.put('/address/:id', requireCustomer, AddressController.updateAddress);

// DELETE /api/v1/user/addresses/address/:id - Delete an existing address
router.delete('/address/:id', requireCustomer, AddressController.deleteAddress);

module.exports = router;
