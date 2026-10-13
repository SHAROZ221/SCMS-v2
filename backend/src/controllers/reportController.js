const { Op } = require('sequelize');
const {
  ServiceTicket,
  Customer,
  Device,
  User,
  SparePart,
  Invoice,
  Notification,
} = require('../models');

/**
 * @desc    Get dashboard executive KPI statistics
 * @route   GET /api/reports/dashboard-stats
 * @access  Admin, Receptionist
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalTickets,
      todayTickets,
      pendingTickets,
      readyTickets,
      deliveredTickets,
      totalCustomers,
      invoices,
      allParts,
    ] = await Promise.all([
      ServiceTicket.count(),
      ServiceTicket.count({ where: { createdAt: { [Op.gte]: today } } }),
      ServiceTicket.count({
        where: {
          status: { [Op.in]: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING'] },
        },
      }),
      ServiceTicket.count({ where: { status: 'READY' } }),
      ServiceTicket.count({ where: { status: 'DELIVERED' } }),
      Customer.count({ where: { is_active: true } }),
      Invoice.findAll({ attributes: ['total_amount', 'payment_status', 'payment_method'] }),
      SparePart.findAll({ where: { is_active: true }, attributes: ['quantity_in_stock', 'reorder_level'] }),
    ]);

    // Compute revenue stats
    let totalRevenue = 0;
    let pendingRevenue = 0;
    const paymentMethodBreakdown = { UPI: 0, CARD: 0, CASH: 0, ONLINE: 0 };

    invoices.forEach((inv) => {
      const amount = parseFloat(inv.total_amount || 0);
      if (inv.payment_status === 'PAID') {
        totalRevenue += amount;
        if (inv.payment_method && paymentMethodBreakdown[inv.payment_method] !== undefined) {
          paymentMethodBreakdown[inv.payment_method] += amount;
        }
      } else if (inv.payment_status === 'PENDING') {
        pendingRevenue += amount;
      }
    });

    // Compute low stock items
    const lowStockCount = allParts.filter(p => p.quantity_in_stock <= p.reorder_level).length;

    // Status breakdown for donut charts
    const statuses = ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING', 'READY', 'DELIVERED', 'CANCELLED'];
    const statusDistribution = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await ServiceTicket.count({ where: { status } }),
      }))
    );

    // Recent 5 tickets for dashboard feed
    const recentTickets = await ServiceTicket.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { model: Device, as: 'device', attributes: ['brand', 'model'] },
        { model: User, as: 'technician', attributes: ['name'] },
      ],
    });

    return res.status(200).json({
      summary: {
        totalTickets,
        todayTickets,
        pendingTickets,
        readyTickets,
        deliveredTickets,
        totalCustomers,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        pendingRevenue: parseFloat(pendingRevenue.toFixed(2)),
        lowStockCount,
      },
      paymentMethodBreakdown,
      statusDistribution,
      recentTickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get ticket trends by date
 * @route   GET /api/reports/ticket-trends
 * @access  Admin
 */
const getTicketTrends = async (req, res, next) => {
  try {
    const tickets = await ServiceTicket.findAll({
      attributes: ['createdAt', 'status'],
      order: [['createdAt', 'ASC']],
    });

    // Group tickets by date YYYY-MM-DD
    const dateMap = {};
    tickets.forEach((t) => {
      const d = new Date(t.createdAt).toISOString().split('T')[0];
      if (!dateMap[d]) {
        dateMap[d] = { date: d, count: 0, resolved: 0 };
      }
      dateMap[d].count += 1;
      if (['READY', 'DELIVERED'].includes(t.status)) {
        dateMap[d].resolved += 1;
      }
    });

    const trends = Object.values(dateMap);

    return res.status(200).json({ trends });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get revenue report
 * @route   GET /api/reports/revenue
 * @access  Admin
 */
const getRevenueReport = async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      order: [['createdAt', 'ASC']],
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
    });

    const dailyRevenue = {};
    invoices.forEach((inv) => {
      if (inv.payment_status === 'PAID') {
        const d = new Date(inv.paid_at || inv.createdAt).toISOString().split('T')[0];
        if (!dailyRevenue[d]) {
          dailyRevenue[d] = { date: d, amount: 0, count: 0 };
        }
        dailyRevenue[d].amount += parseFloat(inv.total_amount || 0);
        dailyRevenue[d].count += 1;
      }
    });

    return res.status(200).json({
      revenueTrends: Object.values(dailyRevenue),
      totalInvoices: invoices.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get technician performance metrics
 * @route   GET /api/reports/technician-performance
 * @access  Admin
 */
const getTechnicianPerformance = async (req, res, next) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician' },
      attributes: ['id', 'name', 'email', 'is_active'],
    });

    const performance = await Promise.all(
      technicians.map(async (tech) => {
        const tickets = await ServiceTicket.findAll({
          where: { technician_id: tech.id },
          attributes: ['id', 'status', 'createdAt', 'completed_at'],
        });

        const totalAssigned = tickets.length;
        const resolvedTickets = tickets.filter(t => ['READY', 'DELIVERED'].includes(t.status));
        const activeTickets = tickets.filter(t =>
          ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING'].includes(t.status)
        );

        // Calculate average resolution time in hours
        let totalHours = 0;
        let counted = 0;
        resolvedTickets.forEach((t) => {
          if (t.completed_at && t.createdAt) {
            const diffHours = (new Date(t.completed_at) - new Date(t.createdAt)) / (1000 * 60 * 60);
            totalHours += Math.max(0.5, diffHours);
            counted++;
          }
        });

        const avgResolutionHours = counted > 0 ? parseFloat((totalHours / counted).toFixed(1)) : 0;

        return {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          totalAssigned,
          activeCount: activeTickets.length,
          resolvedCount: resolvedTickets.length,
          avgResolutionHours,
          completionRate: totalAssigned > 0 ? Math.round((resolvedTickets.length / totalAssigned) * 100) : 0,
        };
      })
    );

    return res.status(200).json({ performance });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List sent notification logs
 * @route   GET /api/reports/notifications
 * @access  Admin
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      limit: 50,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { model: ServiceTicket, as: 'ticket', attributes: ['ticket_number'] },
      ],
    });

    return res.status(200).json({ notifications, count: notifications.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getTicketTrends,
  getRevenueReport,
  getTechnicianPerformance,
  getNotifications,
};
