const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketTimeline = sequelize.define('TicketTimeline', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'ticket_timelines',
  timestamps: true,
});

module.exports = TicketTimeline;
