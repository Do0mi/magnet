const jwt = require('jsonwebtoken');

/**
 * Optional authentication middleware
 * Allows requests to proceed with or without authentication
 * If token is provided and valid, adds user info to req.user
 * If no token or invalid token, req.user remains undefined
 */
module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    // If no authorization header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = undefined;
      return next();
    }
    
    // Get and verify token
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token (only if JWT_SECRET is configured)
      if (!process.env.JWT_SECRET) {
        req.user = undefined;
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user from payload to request
      req.user = decoded;
    } catch (tokenError) {
      // Token is invalid, but we continue without authentication
      req.user = undefined;
    }
    
    next();
  } catch (err) {
    // If there's any other error, continue without authentication
    req.user = undefined;
    next();
  }
};
