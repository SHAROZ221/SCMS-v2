const { Op } = require('sequelize');
const {
  ServiceTicket,
  Customer,
  Device,
  User,
  TicketTimeline,
  SparePart,
  TicketPart,
  Invoice,
  Notification,
  sequelize,
} = require('../models');
const { generateTicketNumber } = require('../services/numberGenerator');
const { sendNotification } = require('../services/notificationService');

/**
 * @desc    List tickets with filters, search, and pagination
 * @route   GET /api/tickets
 * @access  All roles
 */
const getTickets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const { status, priority, technician_id, date_from, date_to, q, my_tickets } = req.query;
    const whereClause = {};

    // Filter by role or query parameter
    if (my_tickets === 'true' || (req.user.role === 'technician' && !req.query.all_technicians)) {
      whereClause.technician_id = req.user.id;
    } else if (technician_id) {
      whereClause.technician_id = technician_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (date_from && date_to) {
      whereClause.createdAt = {
        [Op.between]: [new Date(date_from), new Date(date_to + 'T23:59:59Z')],
      };
    } else if (date_from) {
      whereClause.createdAt = { [Op.gte]: new Date(date_from) };
    } else if (date_to) {
      whereClause.createdAt = { [Op.lte]: new Date(date_to + 'T23:59:59Z') };
    }

    const customerWhere = {};
    if (q && q.trim()) {
      whereClause[Op.or] = [
        { ticket_number: { [Op.like]: `%${q}%` } },
        { complaint_description: { [Op.like]: `%${q}%` } },
        { '$customer.name$': { [Op.like]: `%${q}%` } },
        { '$customer.phone$': { [Op.like]: `%${q}%` } },
      ];
    }

    const { count, rows: tickets } = await ServiceTicket.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
          where: customerWhere,
          required: false,
        },
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'brand', 'model', 'serial_number', 'category', 'warranty_expiry'],
        },
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoice_number', 'total_amount', 'payment_status'],
        },
      ],
      distinct: true,
    });

    return res.status(200).json({
      tickets,
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
 * @desc    Get ticket statistics summary
 * @route   GET /api/tickets/stats
 * @access  All roles
 */
const getTicketStats = async (req, res, next) => {
  try {
    const total = await ServiceTicket.count();
    const received = await ServiceTicket.count({ where: { status: 'RECEIVED' } });
    const diagnosing = await ServiceTicket.count({ where: { status: 'DIAGNOSING' } });
    const waitingParts = await ServiceTicket.count({ where: { status: 'WAITING_FOR_PARTS' } });
    const repairing = await ServiceTicket.count({ where: { status: 'REPAIRING' } });
    const ready = await ServiceTicket.count({ where: { status: 'READY' } });
    const delivered = await ServiceTicket.count({ where: { status: 'DELIVERED' } });
    const cancelled = await ServiceTicket.count({ where: { status: 'CANCELLED' } });

    const activeTickets = received + diagnosing + waitingParts + repairing;

    // Today's tickets count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await ServiceTicket.count({
      where: {
        createdAt: { [Op.gte]: todayStart },
      },
    });

    return res.status(200).json({
      total,
      active: activeTickets,
      today: todayCount,
      byStatus: {
        RECEIVED: received,
        DIAGNOSING: diagnosing,
        WAITING_FOR_PARTS: waitingParts,
        REPAIRING: repairing,
        READY: ready,
        DELIVERED: delivered,
        CANCELLED: cancelled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed ticket by ID
 * @route   GET /api/tickets/:id
 * @access  All roles
 */
const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await ServiceTicket.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: Device,
          as: 'device',
        },
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'email', 'role'],
        },
        {
          model: TicketPart,
          as: 'ticketParts',
          include: [{ model: SparePart, as: 'part' }],
        },
        {
          model: TicketTimeline,
          as: 'timeline',
          include: [{ model: User, as: 'changedByUser', attributes: ['id', 'name', 'role'] }],
          order: [['createdAt', 'ASC']],
        },
        {
          model: Invoice,
          as: 'invoice',
        },
        {
          model: Notification,
          as: 'notifications',
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({
        error: { message: 'Service ticket not found', status: 404 },
      });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new service ticket
 * @route   POST /api/tickets
 * @access  Admin, Receptionist
 */
const createTicket = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      customer_id,
      device_id,
      complaint_description,
      priority = 'MEDIUM',
      technician_id,
      estimated_cost = 0.00,
    } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({
        error: { message: 'Customer not found', status: 404 },
      });
    }

    const device = await Device.findByPk(device_id);
    if (!device) {
      await transaction.rollback();
      return res.status(404).json({
        error: { message: 'Device not found', status: 404 },
      });
    }

    const ticket_number = await generateTicketNumber();

    const ticket = await ServiceTicket.create(
      {
        ticket_number,
        customer_id,
        device_id,
        technician_id: technician_id || null,
        status: 'RECEIVED',
        priority,
        complaint_description,
        estimated_cost,
      },
      { transaction }
    );

    // Initial timeline record
    await TicketTimeline.create(
      {
        ticket_id: ticket.id,
        status: 'RECEIVED',
        notes: `Ticket created. Intake complaint: ${complaint_description}`,
        changed_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Asynchronously dispatch intake email notification
    if (customer.email) {
      sendNotification({
        ticketId: ticket.id,
        customerId: customer.id,
        recipient: customer.email,
        subject: `Service Request Registered - ${ticket.ticket_number}`,
        message: `Hello ${customer.name},\n\nYour ${device.brand} ${device.model} has been received at our service center.\nTicket Number: ${ticket.ticket_number}\nComplaint: ${complaint_description}\n\nYou can track the progress using this ticket number.`,
      }).catch(err => console.error('Notification dispatch error:', err));
    }

    return res.status(201).json({
      message: 'Service ticket created successfully',
      ticket,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Update ticket status and log timeline
 * @route   PATCH /api/tickets/:id/status
 * @access  All roles (Technicians can only update their assigned tickets)
 */
const updateTicketStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const ticket = await ServiceTicket.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Device, as: 'device' },
      ],
      transaction,
    });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({
        error: { message: 'Ticket not found', status: 404 },
      });
    }

    // Role-based validation
    if (req.user.role === 'technician' && ticket.technician_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        error: {
          message: 'Access denied. You can only update tickets assigned to you.',
          status: 403,
        },
      });
    }

    const previousStatus = ticket.status;
    ticket.status = status;

    if (status === 'READY') {
      ticket.completed_at = new Date();
    } else if (status === 'DELIVERED') {
      ticket.delivered_at = new Date();
    }

    await ticket.save({ transaction });

    // Append to timeline
    await TicketTimeline.create(
      {
        ticket_id: ticket.id,
        status,
        notes: notes || `Status changed from ${previousStatus} to ${status}.`,
        changed_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Trigger status change customer email notification
    if (ticket.customer && ticket.customer.email) {
      const statusDescriptions = {
        DIAGNOSING: 'Our technician is examining your device.',
        WAITING_FOR_PARTS: 'We are awaiting replacement spare parts for your device.',
        REPAIRING: 'Active repair is in progress on your device.',
        READY: 'Repair completed! Your device is ready for pickup at our service center.',
        DELIVERED: 'Your device has been delivered. Thank you for choosing Samsung Care.',
        CANCELLED: 'Your service request has been cancelled.',
      };

      const customMsg = statusDescriptions[status] || `Status updated to: ${status}`;

      sendNotification({
        ticketId: ticket.id,
        customerId: ticket.customer.id,
        recipient: ticket.customer.email,
        subject: `Update on Ticket ${ticket.ticket_number}: ${status}`,
        message: `Hello ${ticket.customer.name},\n\nThe status of your ${ticket.device ? ticket.device.model : 'device'} (${ticket.ticket_number}) has been updated to "${status}".\n\nDetails: ${customMsg}\n${notes ? `Technician Notes: ${notes}` : ''}`,
      }).catch(err => console.error('Notification dispatch error:', err));
    }

    return res.status(200).json({
      message: `Ticket status updated to ${status}`,
      ticket,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Assign or reassign technician
 * @route   PATCH /api/tickets/:id/assign
 * @access  Admin, Receptionist
 */
const assignTechnician = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    const ticket = await ServiceTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: { message: 'Ticket not found', status: 404 } });
    }

    const technician = await User.findByPk(technician_id);
    if (!technician || technician.role !== 'technician') {
      return res.status(400).json({
        error: { message: 'Selected user is not a valid technician', status: 400 },
      });
    }

    ticket.technician_id = technician_id;
    await ticket.save();

    await TicketTimeline.create({
      ticket_id: ticket.id,
      status: ticket.status,
      notes: `Technician ${technician.name} assigned to ticket.`,
      changed_by: req.user.id,
    });

    return res.status(200).json({
      message: `Assigned technician ${technician.name} successfully`,
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add spare part to ticket (decrements inventory)
 * @route   POST /api/tickets/:id/parts
 * @access  Admin, Technician
 */
const addPartToTicket = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { part_id, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    const ticket = await ServiceTicket.findByPk(id, { transaction });
    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({ error: { message: 'Ticket not found', status: 404 } });
    }

    if (req.user.role === 'technician' && ticket.technician_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        error: { message: 'You can only consume parts for your assigned tickets', status: 403 },
      });
    }

    const part = await SparePart.findByPk(part_id, { transaction });
    if (!part) {
      await transaction.rollback();
      return res.status(404).json({ error: { message: 'Spare part not found', status: 404 } });
    }

    // Check inventory stock (FR-06.7: Prevent using parts with zero or insufficient stock)
    if (part.quantity_in_stock < qty) {
      await transaction.rollback();
      return res.status(400).json({
        error: {
          message: `Insufficient inventory. Available: ${part.quantity_in_stock}, requested: ${qty}`,
          status: 400,
        },
      });
    }

    // Decrement inventory stock
    part.quantity_in_stock -= qty;
    await part.save({ transaction });

    // Check if this part is already on this ticket
    let ticketPart = await TicketPart.findOne({
      where: { ticket_id: ticket.id, part_id: part.id },
      transaction,
    });

    if (ticketPart) {
      ticketPart.quantity_used += qty;
      ticketPart.price_charged = parseFloat(part.unit_price) * ticketPart.quantity_used;
      await ticketPart.save({ transaction });
    } else {
      ticketPart = await TicketPart.create(
        {
          ticket_id: ticket.id,
          part_id: part.id,
          quantity_used: qty,
          price_charged: parseFloat(part.unit_price) * qty,
        },
        { transaction }
      );
    }

    await TicketTimeline.create(
      {
        ticket_id: ticket.id,
        status: ticket.status,
        notes: `Part consumed: ${part.part_name} (${qty}x @ ₹${part.unit_price}).`,
        changed_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      message: 'Spare part added to ticket successfully',
      ticketPart,
      remainingStock: part.quantity_in_stock,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Remove spare part from ticket (restores inventory)
 * @route   DELETE /api/tickets/:id/parts/:partId
 * @access  Admin, Technician
 */
const removePartFromTicket = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, partId } = req.params;

    const ticketPart = await TicketPart.findOne({
      where: { ticket_id: id, part_id: partId },
      include: [{ model: SparePart, as: 'part' }],
      transaction,
    });

    if (!ticketPart) {
      await transaction.rollback();
      return res.status(404).json({ error: { message: 'Part is not linked to this ticket', status: 404 } });
    }

    // Restore stock
    const part = await SparePart.findByPk(partId, { transaction });
    if (part) {
      part.quantity_in_stock += ticketPart.quantity_used;
      await part.save({ transaction });
    }

    await ticketPart.destroy({ transaction });

    await TicketTimeline.create(
      {
        ticket_id: id,
        status: 'REPAIRING',
        notes: `Part removed: ${part ? part.part_name : 'Item'}. Stock restored.`,
        changed_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      message: 'Spare part removed and inventory restored successfully',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Update diagnosis or repair notes
 * @route   PATCH /api/tickets/:id/notes
 * @access  Admin, Technician
 */
const updateNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosis_notes, repair_notes, estimated_cost } = req.body;

    const ticket = await ServiceTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: { message: 'Ticket not found', status: 404 } });
    }

    if (req.user.role === 'technician' && ticket.technician_id !== req.user.id) {
      return res.status(403).json({
        error: { message: 'You can only edit notes for tickets assigned to you', status: 403 },
      });
    }

    if (diagnosis_notes !== undefined) ticket.diagnosis_notes = diagnosis_notes;
    if (repair_notes !== undefined) ticket.repair_notes = repair_notes;
    if (estimated_cost !== undefined) ticket.estimated_cost = estimated_cost;

    await ticket.save();

    return res.status(200).json({
      message: 'Notes updated successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTickets,
  getTicketStats,
  getTicketById,
  createTicket,
  updateTicketStatus,
  assignTechnician,
  addPartToTicket,
  removePartFromTicket,
  updateNotes,
};
