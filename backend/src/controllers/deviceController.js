const { Op } = require('sequelize');
const { Device, Customer, ServiceTicket } = require('../models');

/**
 * @desc    Get all devices with filters and search
 * @route   GET /api/devices
 * @access  All roles
 */
const getDevices = async (req, res, next) => {
  try {
    const { customer_id, category, q } = req.query;
    const whereClause = {};

    if (customer_id) {
      whereClause.customer_id = customer_id;
    }

    if (category) {
      whereClause.category = category;
    }

    if (q && q.trim()) {
      whereClause[Op.or] = [
        { serial_number: { [Op.like]: `%${q}%` } },
        { model: { [Op.like]: `%${q}%` } },
        { brand: { [Op.like]: `%${q}%` } },
      ];
    }

    const devices = await Device.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ devices, count: devices.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get device by ID with customer and repair history
 * @route   GET /api/devices/:id
 * @access  All roles
 */
const getDeviceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const device = await Device.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: ServiceTicket,
          as: 'tickets',
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!device) {
      return res.status(404).json({
        error: { message: 'Device not found', status: 404 },
      });
    }

    return res.status(200).json({ device });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new device
 * @route   POST /api/devices
 * @access  Admin, Receptionist
 */
const createDevice = async (req, res, next) => {
  try {
    const {
      customer_id,
      brand = 'Samsung',
      model,
      serial_number,
      category = 'Smartphone',
      purchase_date,
      warranty_period_months = 12,
    } = req.body;

    // Verify customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({
        error: { message: 'Customer not found. Please register customer first.', status: 404 },
      });
    }

    // Check duplicate serial number
    const existing = await Device.findOne({ where: { serial_number } });
    if (existing) {
      return res.status(409).json({
        error: {
          message: 'A device with this serial number is already registered.',
          existingDevice: {
            id: existing.id,
            brand: existing.brand,
            model: existing.model,
            serial_number: existing.serial_number,
          },
          status: 409,
        },
      });
    }

    let warranty_expiry = null;
    if (purchase_date) {
      const pDate = new Date(purchase_date);
      pDate.setMonth(pDate.getMonth() + parseInt(warranty_period_months, 10));
      warranty_expiry = pDate.toISOString().split('T')[0];
    }

    const device = await Device.create({
      customer_id,
      brand,
      model,
      serial_number,
      category,
      purchase_date: purchase_date || null,
      warranty_period_months: parseInt(warranty_period_months, 10) || 12,
      warranty_expiry,
    });

    return res.status(201).json({
      message: 'Device registered successfully',
      device,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update device details
 * @route   PUT /api/devices/:id
 * @access  Admin, Receptionist
 */
const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model, serial_number, category, purchase_date, warranty_period_months } = req.body;

    const device = await Device.findByPk(id);
    if (!device) {
      return res.status(404).json({
        error: { message: 'Device not found', status: 404 },
      });
    }

    if (serial_number && serial_number !== device.serial_number) {
      const existing = await Device.findOne({
        where: { serial_number, id: { [Op.ne]: id } },
      });
      if (existing) {
        return res.status(409).json({
          error: { message: 'Another device with this serial number already exists.', status: 409 },
        });
      }
      device.serial_number = serial_number;
    }

    if (brand !== undefined) device.brand = brand;
    if (model !== undefined) device.model = model;
    if (category !== undefined) device.category = category;
    if (purchase_date !== undefined) device.purchase_date = purchase_date;
    if (warranty_period_months !== undefined) {
      device.warranty_period_months = parseInt(warranty_period_months, 10);
    }

    if (device.purchase_date) {
      const pDate = new Date(device.purchase_date);
      pDate.setMonth(pDate.getMonth() + (device.warranty_period_months || 12));
      device.warranty_expiry = pDate.toISOString().split('T')[0];
    }

    await device.save();

    return res.status(200).json({
      message: 'Device updated successfully',
      device,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
};
