const express = require('express');
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', inventoryController.getParts);
router.get('/low-stock', inventoryController.getLowStockParts);

router.post(
  '/',
  [
    authorizeRoles('admin'),
    body('part_name').trim().notEmpty().withMessage('Part name is required'),
    body('part_number').trim().notEmpty().withMessage('Part number is required'),
    body('quantity_in_stock').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
    body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
    validate,
  ],
  inventoryController.createPart
);

router.put(
  '/:id',
  [
    authorizeRoles('admin'),
    body('part_name').optional().trim().notEmpty().withMessage('Part name cannot be empty'),
    validate,
  ],
  inventoryController.updatePart
);

router.patch(
  '/:id/restock',
  [
    authorizeRoles('admin'),
    body('quantityToAdd').isInt({ min: 1 }).withMessage('quantityToAdd must be at least 1'),
    validate,
  ],
  inventoryController.restockPart
);

module.exports = router;
