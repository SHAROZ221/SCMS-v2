const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'scms-secret-jwt-key-2026-samsung-care';

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Access token required. Please log in.',
        status: 401,
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'User belonging to this token no longer exists.',
          status: 401,
        },
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: {
          message: 'Your account has been deactivated. Please contact an administrator.',
          status: 403,
        },
      });
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          message: 'Token has expired. Please log in again.',
          status: 401,
        },
      });
    }
    return res.status(401).json({
      error: {
        message: 'Invalid token.',
        status: 401,
      },
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param  {...string} allowedRoles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required.',
          status: 401,
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
          status: 403,
        },
      });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles,
};
