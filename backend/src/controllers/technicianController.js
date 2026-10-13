const { Op } = require('sequelize');
const { User, ServiceTicket, Customer, Device } = require('../models');

/**
 * @desc    Get all technicians with their current workload
 * @route   GET /api/technicians
 * @access  Admin, Receptionist
 */
const getTechnicians = async (req, res, next) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician', is_active: true },
      attributes: ['id', 'name', 'email', 'createdAt'],
      order: [['name', 'ASC']],
    });

    const activeStatuses = ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING'];

    // Calculate workload for each technician
    const techData = await Promise.all(
      technicians.map(async (tech) => {
        const activeCount = await ServiceTicket.count({
          where: {
            technician_id: tech.id,
            status: { [Op.in]: activeStatuses },
          },
        });

        const resolvedCount = await ServiceTicket.count({
          where: {
            technician_id: tech.id,
            status: { [Op.in]: ['READY', 'DELIVERED'] },
          },
        });

        const totalAssigned = await ServiceTicket.count({
          where: { technician_id: tech.id },
        });

        return {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          activeWorkload: activeCount,
          resolvedCount,
          totalAssigned,
          isAvailable: activeCount < 5, // Status flag
        };
      })
    );

    return res.status(200).json({ technicians: techData, count: techData.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available technicians ranked by lowest active workload
 * @route   GET /api/technicians/available
 * @access  Admin, Receptionist
 */
const getAvailableTechnicians = async (req, res, next) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician', is_active: true },
      attributes: ['id', 'name', 'email'],
    });

    const activeStatuses = ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING'];

    const techWithWorkload = await Promise.all(
      technicians.map(async (tech) => {
        const activeCount = await ServiceTicket.count({
          where: {
            technician_id: tech.id,
            status: { [Op.in]: activeStatuses },
          },
        });

        return {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          activeWorkload: activeCount,
        };
      })
    );

    // Sort by lowest workload first
    techWithWorkload.sort((a, b) => a.activeWorkload - b.activeWorkload);

    return res.status(200).json({
      technicians: techWithWorkload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed active tickets for a specific technician
 * @route   GET /api/technicians/:id/workload
 * @access  Admin, Receptionist
 */
const getTechnicianWorkload = async (req, res, next) => {
  try {
    const { id } = req.params;

    const technician = await User.findOne({
      where: { id, role: 'technician' },
      attributes: ['id', 'name', 'email', 'is_active'],
    });

    if (!technician) {
      return res.status(404).json({ error: { message: 'Technician not found', status: 404 } });
    }

    const activeStatuses = ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING'];

    const activeTickets = await ServiceTicket.findAll({
      where: {
        technician_id: id,
        status: { [Op.in]: activeStatuses },
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
        { model: Device, as: 'device', attributes: ['id', 'brand', 'model', 'serial_number'] },
      ],
      order: [['priority', 'DESC'], ['createdAt', 'ASC']],
    });

    return res.status(200).json({
      technician,
      activeTickets,
      activeCount: activeTickets.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTechnicians,
  getAvailableTechnicians,
  getTechnicianWorkload,
};
