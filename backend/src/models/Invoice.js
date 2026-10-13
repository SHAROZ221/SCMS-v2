const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  parts_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  labor_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  tax_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 18.00, // 18% GST
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  payment_status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'REFUNDED'),
    defaultValue: 'PENDING',
  },
  payment_method: {
    type: DataTypes.ENUM('CASH', 'CARD', 'UPI', 'ONLINE'),
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'invoices',
  timestamps: true,
});

module.exports = Invoice;
