const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Device = require('./Device');
const ServiceTicket = require('./ServiceTicket');
const TicketTimeline = require('./TicketTimeline');
const SparePart = require('./SparePart');
const TicketPart = require('./TicketPart');
const Invoice = require('./Invoice');
const Notification = require('./Notification');

// --- User Associations ---
User.hasMany(ServiceTicket, { foreignKey: 'technician_id', as: 'assignedTickets' });
ServiceTicket.belongsTo(User, { foreignKey: 'technician_id', as: 'technician' });

User.hasMany(TicketTimeline, { foreignKey: 'changed_by', as: 'timelineChanges' });
TicketTimeline.belongsTo(User, { foreignKey: 'changed_by', as: 'changedByUser' });

// --- Customer Associations ---
Customer.hasMany(Device, { foreignKey: 'customer_id', as: 'devices' });
Device.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasMany(ServiceTicket, { foreignKey: 'customer_id', as: 'tickets' });
ServiceTicket.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasMany(Invoice, { foreignKey: 'customer_id', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasMany(Notification, { foreignKey: 'customer_id', as: 'notifications' });
Notification.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// --- Device Associations ---
Device.hasMany(ServiceTicket, { foreignKey: 'device_id', as: 'tickets' });
ServiceTicket.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });

// --- ServiceTicket Associations ---
ServiceTicket.hasMany(TicketTimeline, { foreignKey: 'ticket_id', as: 'timeline' });
TicketTimeline.belongsTo(ServiceTicket, { foreignKey: 'ticket_id', as: 'ticket' });

ServiceTicket.hasOne(Invoice, { foreignKey: 'ticket_id', as: 'invoice' });
Invoice.belongsTo(ServiceTicket, { foreignKey: 'ticket_id', as: 'ticket' });

ServiceTicket.hasMany(Notification, { foreignKey: 'ticket_id', as: 'notifications' });
Notification.belongsTo(ServiceTicket, { foreignKey: 'ticket_id', as: 'ticket' });

// --- Spare Parts / Ticket Parts Associations ---
ServiceTicket.belongsToMany(SparePart, {
  through: TicketPart,
  foreignKey: 'ticket_id',
  otherKey: 'part_id',
  as: 'parts',
});
SparePart.belongsToMany(ServiceTicket, {
  through: TicketPart,
  foreignKey: 'part_id',
  otherKey: 'ticket_id',
  as: 'tickets',
});

ServiceTicket.hasMany(TicketPart, { foreignKey: 'ticket_id', as: 'ticketParts' });
TicketPart.belongsTo(ServiceTicket, { foreignKey: 'ticket_id', as: 'ticket' });

SparePart.hasMany(TicketPart, { foreignKey: 'part_id', as: 'ticketParts' });
TicketPart.belongsTo(SparePart, { foreignKey: 'part_id', as: 'part' });

module.exports = {
  sequelize,
  User,
  Customer,
  Device,
  ServiceTicket,
  TicketTimeline,
  SparePart,
  TicketPart,
  Invoice,
  Notification,
};
