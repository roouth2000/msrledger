const sequelize = require('../config/db');
const User = require('./user');

const db = {
  sequelize,
  User,
};

module.exports = db;
