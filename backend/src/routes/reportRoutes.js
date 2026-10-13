const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);

router.get('/dashboard-stats', authorizeRoles('admin', 'receptionist'), reportController.getDashboardStats);
router.get('/ticket-trends', authorizeRoles('admin'), reportController.getTicketTrends);
router.get('/revenue', authorizeRoles('admin'), reportController.getRevenueReport);
router.get('/technician-performance', authorizeRoles('admin'), reportController.getTechnicianPerformance);
router.get('/notifications', authorizeRoles('admin'), reportController.getNotifications);

module.exports = router;
