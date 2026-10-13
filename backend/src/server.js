const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SCMS Backend API is running smoothly',
    timestamp: new Date().toISOString(),
    dialect: sequelize.getDialect(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/technicians', require('./routes/technicianRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));


// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      status,
    },
  });
});

// Start Server & verify DB connection
if (process.env.NODE_ENV !== 'test') {
  sequelize.authenticate()
    .then(() => {
      console.log(`✅ Database connected successfully (${sequelize.getDialect()})`);
      app.listen(PORT, () => {
        console.log(`🚀 SCMS Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Unable to connect to the database:', err);
    });
}

module.exports = app;
