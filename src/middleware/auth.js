const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Safely resolves the JWT secret.
 * Rejects hardcoded fallbacks in production.
 */
function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  // Dynamic generation for development and test environments with server warning
  console.warn("WARNING: JWT_SECRET env variable is missing. Generating ephemeral secret (Instance-isolated)!");
  if (!global.ephemeralJwtSecret) {
    global.ephemeralJwtSecret = crypto.randomBytes(32).toString('hex');
  }
  return global.ephemeralJwtSecret;
}

/**
 * Middleware to authenticate requests via JWT Bearer Token.
 * Enforces expected algorithms to reject the 'none' algorithm attack.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }

  try {
    const secret = getJwtSecret();
    // Enforce expected algorithm: HS256. This rejects any 'none' algorithm attempt.
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    
    // Attach decoded user information to the request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = {
  authMiddleware,
  getJwtSecret,
};
