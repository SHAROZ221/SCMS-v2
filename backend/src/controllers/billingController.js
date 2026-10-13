const { Op } = require('sequelize');
const {
  Invoice,
  ServiceTicket,
  Customer,
  Device,
  TicketPart,
  SparePart,
  sequelize,
} = require('../models');
const { generateInvoiceNumber } = require('../services/numberGenerator');
const { sendNotification } = require('../services/notificationService');

/**
 * @desc    Get all invoices with filters & search
 * @route   GET /api/billing
 * @access  Admin, Receptionist
 */
const getInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const { status, q } = req.query;
    const whereClause = {};

    if (status) {
      whereClause.payment_status = status;
    }

    if (q && q.trim()) {
      whereClause[Op.or] = [
        { invoice_number: { [Op.like]: `%${q}%` } },
        { '$customer.name$': { [Op.like]: `%${q}%` } },
        { '$customer.phone$': { [Op.like]: `%${q}%` } },
      ];
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email'],
        },
        {
          model: ServiceTicket,
          as: 'ticket',
          attributes: ['id', 'ticket_number', 'status', 'priority'],
          include: [{ model: Device, as: 'device', attributes: ['brand', 'model', 'serial_number'] }],
        },
      ],
      distinct: true,
    });

    return res.status(200).json({
      invoices,
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
 * @desc    Get single invoice by ID
 * @route   GET /api/billing/:id
 * @access  All roles
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: ServiceTicket,
          as: 'ticket',
          include: [
            { model: Device, as: 'device' },
            {
              model: TicketPart,
              as: 'ticketParts',
              include: [{ model: SparePart, as: 'part' }],
            },
          ],
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found', status: 404 } });
    }

    return res.status(200).json({ invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate invoice from completed or ready service ticket
 * @route   POST /api/billing/generate
 * @access  Admin, Receptionist
 */
const generateInvoice = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { ticket_id, labor_cost = 0, discount_amount = 0, notes } = req.body;

    const ticket = await ServiceTicket.findByPk(ticket_id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Device, as: 'device' },
        { model: TicketPart, as: 'ticketParts' },
        { model: Invoice, as: 'invoice' },
      ],
      transaction,
    });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({ error: { message: 'Service ticket not found', status: 404 } });
    }

    if (ticket.invoice) {
      await transaction.rollback();
      return res.status(409).json({
        error: {
          message: 'An invoice has already been generated for this ticket',
          existingInvoice: ticket.invoice,
          status: 409,
        },
      });
    }

    // Auto calculate parts cost
    let parts_cost = 0;
    if (ticket.ticketParts && ticket.ticketParts.length > 0) {
      parts_cost = ticket.ticketParts.reduce((sum, item) => sum + parseFloat(item.price_charged || 0), 0);
    }

    const labor = parseFloat(labor_cost) || 0;
    const discount = parseFloat(discount_amount) || 0;
    const subtotal = parts_cost + labor;
    const taxRate = 18.00; // 18% GST standard in India
    const tax_amount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
    const total_amount = parseFloat(Math.max(0, subtotal + tax_amount - discount).toFixed(2));

    const invoice_number = await generateInvoiceNumber();

    const invoice = await Invoice.create(
      {
        invoice_number,
        ticket_id: ticket.id,
        customer_id: ticket.customer_id,
        parts_cost,
        labor_cost: labor,
        subtotal,
        tax_rate: taxRate,
        tax_amount,
        discount_amount: discount,
        total_amount,
        payment_status: 'PENDING',
        notes: notes || null,
      },
      { transaction }
    );

    await transaction.commit();

    // Send notification email
    if (ticket.customer && ticket.customer.email) {
      sendNotification({
        ticketId: ticket.id,
        customerId: ticket.customer.id,
        recipient: ticket.customer.email,
        subject: `Service Invoice Generated - ${invoice.invoice_number}`,
        message: `Hello ${ticket.customer.name},\n\nYour repair invoice ${invoice.invoice_number} for ticket ${ticket.ticket_number} is ready.\n\nParts: ₹${parts_cost.toFixed(2)}\nLabor: ₹${labor.toFixed(2)}\nGST (18%): ₹${tax_amount.toFixed(2)}\nDiscount: ₹${discount.toFixed(2)}\nTotal Amount Payable: ₹${total_amount.toFixed(2)}\n\nPlease settle payment upon device collection.`,
      }).catch(err => console.error('Notification dispatch error:', err));
    }

    return res.status(201).json({
      message: 'Invoice generated successfully',
      invoice,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    Mark invoice as paid and settle payment
 * @route   PATCH /api/billing/:id/pay
 * @access  Admin, Receptionist
 */
const markInvoiceAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_method = 'UPI', notes } = req.body;

    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: ServiceTicket, as: 'ticket' },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found', status: 404 } });
    }

    if (invoice.payment_status === 'PAID') {
      return res.status(400).json({ error: { message: 'Invoice is already settled and paid', status: 400 } });
    }

    invoice.payment_status = 'PAID';
    invoice.payment_method = payment_method;
    invoice.paid_at = new Date();
    if (notes) {
      invoice.notes = invoice.notes ? `${invoice.notes}\n${notes}` : notes;
    }

    await invoice.save();

    // Send receipt notification
    if (invoice.customer && invoice.customer.email) {
      sendNotification({
        ticketId: invoice.ticket_id,
        customerId: invoice.customer_id,
        recipient: invoice.customer.email,
        subject: `Payment Received - Receipt for ${invoice.invoice_number}`,
        message: `Hello ${invoice.customer.name},\n\nWe have received your payment of ₹${parseFloat(invoice.total_amount).toFixed(2)} via ${payment_method}.\nReceipt Number: ${invoice.invoice_number}\n\nThank you for trusting Samsung Care!`,
      }).catch(err => console.error('Notification dispatch error:', err));
    }

    return res.status(200).json({
      message: 'Payment recorded and invoice marked as PAID',
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  generateInvoice,
  markInvoiceAsPaid,
};
