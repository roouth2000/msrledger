const sequelize = require('../config/database');
const User = require('./user');
const Voucher = require('./voucher');
const VoucherItem = require('./voucherItem');

// User -> Voucher (One-to-Many)
User.hasMany(Voucher, { foreignKey: 'userId', onDelete: 'CASCADE' });
Voucher.belongsTo(User, { foreignKey: 'userId' });

// Voucher -> VoucherItem (One-to-Many)
Voucher.hasMany(VoucherItem, { foreignKey: 'voucherId', as: 'items', onDelete: 'CASCADE' });
VoucherItem.belongsTo(Voucher, { foreignKey: 'voucherId' });

const db = {
  sequelize,
  User,
  Voucher,
  VoucherItem,
};

module.exports = db;
