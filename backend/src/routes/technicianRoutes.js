const express = require('express');
const technicianController = require('../controllers/technicianController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin', 'receptionist'), technicianController.getTechnicians);
router.get('/available', authorizeRoles('admin', 'receptionist'), technicianController.getAvailableTechnicians);
router.get('/:id/workload', authorizeRoles('admin', 'receptionist'), technicianController.getTechnicianWorkload);

module.exports = router;
