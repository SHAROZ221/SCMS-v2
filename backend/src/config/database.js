const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const isSqlite = (process.env.DB_DIALECT || 'sqlite') === 'sqlite';

let sequelize;

if (isSqlite) {
  const storagePath = process.env.DB_STORAGE 
    ? path.resolve(__dirname, '../../', process.env.DB_STORAGE)
    : path.resolve(__dirname, '../../database.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: process.env.NODE_ENV === 'development' ? false : false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'scms_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? false : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

module.exports = sequelize;
