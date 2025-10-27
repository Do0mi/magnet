const express = require('express');
const router = express.Router();
const AddressController = require('../../../controllers/dashboard/addresses/addresses-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard address routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/addresses - Get all addresses
router.get('/', requireAdminOrEmployee, AddressController.getAddresses);

// GET /api/v1/dashboard/addresses/:id - Get address by id
router.get('/:id', requireAdminOrEmployee, AddressController.getAddressById);

// POST /api/v1/dashboard/addresses/address - Create an address to a specific user
router.post('/address', requireAdminOrEmployee, AddressController.createAddress);

// PUT /api/v1/dashboard/addresses/address/:id - Update an address to a specific user
router.put('/address/:id', requireAdminOrEmployee, AddressController.updateAddress);

// DELETE /api/v1/dashboard/addresses/address/:id - Delete an address to a specific user
router.delete('/address/:id', requireAdminOrEmployee, AddressController.deleteAddress);

module.exports = router;
