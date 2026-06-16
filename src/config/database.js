const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';

// Load corresponding environment variables
if (env === 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const database = process.env.DB_NAME;
const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST || '127.0.0.1';
const port = process.env.DB_PORT || 3306;

const isProduction = env === 'production';

// Strict validation for production settings to avoid running with fallback defaults
if (isProduction && (!database || !username || !password)) {
  throw new Error('Database configuration env variables (DB_NAME, DB_USER, DB_PASSWORD) are required in production.');
}

// Build SSL configuration for secure connection/mTLS
let sslConfig = false;
if (process.env.DB_SSL === 'true') {
  sslConfig = {
    rejectUnauthorized: true,
  };
  if (process.env.DB_SSL_CA) {
    sslConfig.ca = fs.readFileSync(process.env.DB_SSL_CA);
  }
  if (process.env.DB_SSL_CERT) {
    sslConfig.cert = fs.readFileSync(process.env.DB_SSL_CERT);
  }
  if (process.env.DB_SSL_KEY) {
    sslConfig.key = fs.readFileSync(process.env.DB_SSL_KEY);
  }
}

const sequelize = new Sequelize(database, username, password, {
  host: host,
  port: parseInt(port, 10),
  dialect: 'mysql',
  logging: env === 'test' ? false : console.log,
  dialectOptions: {
    ssl: sslConfig
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
