const express = require('express');
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

router.use(authenticateJWT);

// Stats & listing
router.get('/stats', ticketController.getTicketStats);
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);

// Creation
router.post(
  '/',
  [
    authorizeRoles('admin', 'receptionist'),
    body('customer_id').isInt().withMessage('Valid customer_id is required'),
    body('device_id').isInt().withMessage('Valid device_id is required'),
    body('complaint_description').trim().notEmpty().withMessage('Complaint description is required'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
    validate,
  ],
  ticketController.createTicket
);

// Status update (Admin, Receptionist, or Technician for assigned)
router.patch(
  '/:id/status',
  [
    body('status')
      .isIn(['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING', 'READY', 'DELIVERED', 'CANCELLED'])
      .withMessage('Invalid ticket status provided'),
    validate,
  ],
  ticketController.updateTicketStatus
);

// Assign technician (Admin, Receptionist)
router.patch(
  '/:id/assign',
  [
    authorizeRoles('admin', 'receptionist'),
    body('technician_id').isInt().withMessage('Valid technician_id is required'),
    validate,
  ],
  ticketController.assignTechnician
);

// Parts usage on ticket (Admin, Technician)
router.post(
  '/:id/parts',
  [
    authorizeRoles('admin', 'technician'),
    body('part_id').isInt().withMessage('Valid part_id is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    validate,
  ],
  ticketController.addPartToTicket
);

router.delete(
  '/:id/parts/:partId',
  authorizeRoles('admin', 'technician'),
  ticketController.removePartFromTicket
);

// Diagnosis & Repair Notes
router.patch(
  '/:id/notes',
  authorizeRoles('admin', 'technician'),
  ticketController.updateNotes
);

module.exports = router;
