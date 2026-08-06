const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sakhri_nate_boat_finance_secret_key_2026';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required for this action' });
  }
}

module.exports = {
  JWT_SECRET,
  verifyToken,
  requireAdmin
};
