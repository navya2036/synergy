const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Get token from header - support both x-auth-token and Bearer token
    let token = req.header('x-auth-token');
    
    // If no x-auth-token, try Authorization Bearer
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user from payload
    req.user = {
      id: decoded.user.id,
      userId: decoded.user.id
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;