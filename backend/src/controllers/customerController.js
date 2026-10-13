const { Op } = require('sequelize');
const { Customer, Device, ServiceTicket } = require('../models');

/**
 * @desc    Get all customers with search and pagination
 * @route   GET /api/customers
 * @access  Admin, Receptionist
 */
const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const offset = (page - 1) * limit;
    const search = req.query.q || '';
    const includeInactive = req.query.all === 'true';

    const whereClause = {};
    if (!includeInactive) {
      whereClause.is_active = true;
    }

    if (search.trim()) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Device,
          as: 'devices',
          attributes: ['id', 'brand', 'model', 'serial_number', 'category'],
        },
      ],
      distinct: true,
    });

    return res.status(200).json({
      customers,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer profile with devices and service tickets
 * @route   GET /api/customers/:id
 * @access  Admin, Receptionist
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Device,
          as: 'devices',
        },
        {
          model: ServiceTicket,
          as: 'tickets',
          include: [{ model: Device, as: 'device', attributes: ['model', 'brand'] }],
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        error: { message: 'Customer not found', status: 404 },
      });
    }

    return res.status(200).json({ customer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Admin, Receptionist
 */
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;

    // Check for duplicate phone number
    const existing = await Customer.findOne({ where: { phone } });
    if (existing) {
      return res.status(409).json({
        error: {
          message: 'A customer with this phone number already exists.',
          existingCustomer: {
            id: existing.id,
            name: existing.name,
            phone: existing.phone,
          },
          status: 409,
        },
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      email: email || null,
      address: address || null,
      is_active: true,
    });

    return res.status(201).json({
      message: 'Customer registered successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer details
 * @route   PUT /api/customers/:id
 * @access  Admin, Receptionist
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, is_active } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        error: { message: 'Customer not found', status: 404 },
      });
    }

    // If phone is being changed, ensure no other customer has it
    if (phone && phone !== customer.phone) {
      const duplicate = await Customer.findOne({
        where: { phone, id: { [Op.ne]: id } },
      });
      if (duplicate) {
        return res.status(409).json({
          error: { message: 'Another customer is already registered with this phone number.', status: 409 },
        });
      }
      customer.phone = phone;
    }

    if (name !== undefined) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    if (is_active !== undefined) customer.is_active = is_active;

    await customer.save();

    return res.status(200).json({
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft-delete customer
 * @route   DELETE /api/customers/:id
 * @access  Admin only
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        error: { message: 'Customer not found', status: 404 },
      });
    }

    customer.is_active = false;
    await customer.save();

    return res.status(200).json({
      message: 'Customer soft-deleted successfully (historical records preserved)',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
