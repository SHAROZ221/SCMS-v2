const express = require('express');
const { body } = require('express-validator');
const deviceController = require('../controllers/deviceController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', deviceController.getDevices);
router.get('/:id', deviceController.getDeviceById);

router.post(
  '/',
  [
    authorizeRoles('admin', 'receptionist'),
    body('customer_id').isInt().withMessage('Valid customer_id is required'),
    body('model').trim().notEmpty().withMessage('Device model is required'),
    body('serial_number').trim().notEmpty().withMessage('Serial number is required'),
    validate,
  ],
  deviceController.createDevice
);

router.put(
  '/:id',
  [
    authorizeRoles('admin', 'receptionist'),
    body('model').optional().trim().notEmpty().withMessage('Model cannot be empty'),
    validate,
  ],
  deviceController.updateDevice
);

module.exports = router;
