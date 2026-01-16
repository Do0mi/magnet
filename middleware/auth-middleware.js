const jwt = require('jsonwebtoken');
module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'No token, authorization denied' 
      });
    }
    
    // Get and verify token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Server configuration error' 
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload to request
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      status: 'error', 
      message: 'Token is not valid' 
    });
  }
};
