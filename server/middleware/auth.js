const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bookleaf-secret-key-production-ready-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      author_id: user.author_id || null
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token. Please log in again.'
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required for this endpoint.'
    });
  }

  next();
}

function requireAuthorOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  if (req.user.role !== 'author' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Valid author or admin role required.'
    });
  }

  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  requireAdmin,
  requireAuthorOrAdmin
};
