const { Op } = require('sequelize');
const { ServiceTicket, Invoice } = require('../models');

/**
 * Format a date as YYYYMMDD
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generates sequential ticket number: SVC-YYYYMMDD-NNN
 */
async function generateTicketNumber() {
  const dateStr = getTodayDateString();
  const prefix = `SVC-${dateStr}-`;

  // Find latest ticket with this prefix today
  const latestTicket = await ServiceTicket.findOne({
    where: {
      ticket_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['ticket_number', 'DESC']],
  });

  let nextSequence = 1;
  if (latestTicket) {
    const parts = latestTicket.ticket_number.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(3, '0')}`;
}

/**
 * Generates sequential invoice number: INV-YYYYMMDD-NNN
 */
async function generateInvoiceNumber() {
  const dateStr = getTodayDateString();
  const prefix = `INV-${dateStr}-`;

  const latestInvoice = await Invoice.findOne({
    where: {
      invoice_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['invoice_number', 'DESC']],
  });

  let nextSequence = 1;
  if (latestInvoice) {
    const parts = latestInvoice.invoice_number.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(3, '0')}`;
}

module.exports = {
  generateTicketNumber,
  generateInvoiceNumber,
};
