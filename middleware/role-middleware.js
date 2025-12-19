const User = require('../models/user-model');

// Check if user has required role(s)
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Check if user can login (business must be approved)
      if (!user.canLogin()) {
        return res.status(403).json({
          status: 'error',
          message: 'Account is not active. Please contact support.'
        });
      }

      // Convert single role to array for easier checking
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      if (!requiredRoles.includes(user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        });
      }

      // Add user object to request for use in route handlers
      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  };
};

// Specific role checkers
const requireAdmin = requireRole('admin');
const requireMagnetEmployee = requireRole('magnet_employee');
const requireBusiness = requireRole('business');
const requireCustomer = requireRole('customer');

// Check if user is admin or magnet employee
const requireAdminOrEmployee = requireRole(['admin', 'magnet_employee']);

// Check if user is admin, magnet employee, or business
const requireAdminEmployeeOrBusiness = requireRole(['admin', 'magnet_employee', 'business']);

// Check if user is admin, magnet employee, or customer
const requireAdminEmployeeOrCustomer = requireRole(['admin', 'magnet_employee', 'customer']);

// Check if user is customer or business
const requireCustomerOrBusiness = requireRole(['customer', 'business']);

module.exports = {
  requireRole,
  requireAdmin,
  requireMagnetEmployee,
  requireBusiness,
  requireCustomer,
  requireAdminOrEmployee,
  requireAdminEmployeeOrBusiness,
  requireAdminEmployeeOrCustomer,
  requireCustomerOrBusiness
}; 