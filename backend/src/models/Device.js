const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Samsung',
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  serial_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Smartphone',
  },
  purchase_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  warranty_period_months: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
  },
  warranty_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  is_under_warranty: {
    type: DataTypes.VIRTUAL,
    get() {
      const expiry = this.getDataValue('warranty_expiry');
      if (!expiry) return false;
      const today = new Date().toISOString().split('T')[0];
      return expiry >= today;
    },
  },
}, {
  tableName: 'devices',
  timestamps: true,
  hooks: {
    beforeSave: (device) => {
      if (device.purchase_date && device.warranty_period_months) {
        const purchase = new Date(device.purchase_date);
        purchase.setMonth(purchase.getMonth() + parseInt(device.warranty_period_months, 10));
        device.warranty_expiry = purchase.toISOString().split('T')[0];
      }
    },
  },
});

module.exports = Device;
