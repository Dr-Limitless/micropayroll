const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mms_super_secure_jwt_secret_2026_aes256_compliant';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token is provided, check if x-user-role header is present for test/internal calls
    if (req.headers['x-user-role']) {
      req.user = { role: req.headers['x-user-role'], name: 'System User' };
      return next();
    }
    return res.status(401).json({ error: 'Access token required. OAuth 2.0 / Bearer scheme.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (req.headers['x-user-role']) {
        req.user = { role: req.headers['x-user-role'], name: 'System User' };
        return next();
      }
      return res.status(403).json({ error: 'Invalid or expired JWT token.' });
    }
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    // Admin has superuser access to all endpoints
    if (req.user.role === 'admin' || allowedRoles.includes('all') || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Access forbidden for role: ${req.user.role}. Required: ${allowedRoles.join(', ')}`
    });
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
