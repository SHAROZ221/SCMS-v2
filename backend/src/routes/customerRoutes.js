const express = require('express');
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

router.use(authenticateJWT);

router.get(
  '/',
  authorizeRoles('admin', 'receptionist'),
  customerController.getCustomers
);

router.get(
  '/:id',
  authorizeRoles('admin', 'receptionist'),
  customerController.getCustomerById
);

router.post(
  '/',
  [
    authorizeRoles('admin', 'receptionist'),
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('phone').trim().notEmpty().withMessage('Customer phone number is required'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
    validate,
  ],
  customerController.createCustomer
);

router.put(
  '/:id',
  [
    authorizeRoles('admin', 'receptionist'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
    validate,
  ],
  customerController.updateCustomer
);

router.delete(
  '/:id',
  authorizeRoles('admin'),
  customerController.deleteCustomer
);

module.exports = router;
