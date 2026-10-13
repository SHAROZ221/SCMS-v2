const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

/**
 * Public routes
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

/**
 * Authenticated routes (Any valid role)
 */
router.get('/me', authenticateJWT, authController.getMe);

router.put(
  '/change-password',
  [
    authenticateJWT,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    validate,
  ],
  authController.changePassword
);

/**
 * Admin-only routes
 */
router.post(
  '/register',
  [
    authenticateJWT,
    authorizeRoles('admin'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email address is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['admin', 'receptionist', 'technician'])
      .withMessage('Role must be admin, receptionist, or technician'),
    validate,
  ],
  authController.register
);

router.get(
  '/users',
  [authenticateJWT, authorizeRoles('admin')],
  authController.listUsers
);

router.put(
  '/users/:id',
  [
    authenticateJWT,
    authorizeRoles('admin'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('role')
      .optional()
      .isIn(['admin', 'receptionist', 'technician'])
      .withMessage('Invalid role specified'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean'),
    validate,
  ],
  authController.updateUser
);

module.exports = router;
