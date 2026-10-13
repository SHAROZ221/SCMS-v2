const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceTicket = sequelize.define('ServiceTicket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  technician_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(
      'RECEIVED',
      'DIAGNOSING',
      'WAITING_FOR_PARTS',
      'REPAIRING',
      'READY',
      'DELIVERED',
      'CANCELLED'
    ),
    defaultValue: 'RECEIVED',
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    defaultValue: 'MEDIUM',
  },
  complaint_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  diagnosis_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  repair_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estimated_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'service_tickets',
  timestamps: true,
});

module.exports = ServiceTicket;
