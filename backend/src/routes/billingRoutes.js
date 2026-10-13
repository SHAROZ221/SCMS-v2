const express = require('express');
const { body } = require('express-validator');
const billingController = require('../controllers/billingController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin', 'receptionist'), billingController.getInvoices);
router.get('/:id', billingController.getInvoiceById);

router.post(
  '/generate',
  [
    authorizeRoles('admin', 'receptionist'),
    body('ticket_id').isInt().withMessage('Valid ticket_id is required'),
    body('labor_cost').optional().isFloat({ min: 0 }).withMessage('Labor cost must be non-negative'),
    body('discount_amount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be non-negative'),
    validate,
  ],
  billingController.generateInvoice
);

router.patch(
  '/:id/pay',
  [
    authorizeRoles('admin', 'receptionist'),
    body('payment_method')
      .isIn(['CASH', 'CARD', 'UPI', 'ONLINE'])
      .withMessage('Payment method must be CASH, CARD, UPI, or ONLINE'),
    validate,
  ],
  billingController.markInvoiceAsPaid
);

module.exports = router;
