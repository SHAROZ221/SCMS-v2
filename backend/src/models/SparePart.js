const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SparePart = sequelize.define('SparePart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  part_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  part_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'General',
  },
  quantity_in_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
    },
  },
  reorder_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 0,
    },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_low_stock: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('quantity_in_stock') <= this.getDataValue('reorder_level');
    },
  },
}, {
  tableName: 'spare_parts',
  timestamps: true,
});

module.exports = SparePart;
