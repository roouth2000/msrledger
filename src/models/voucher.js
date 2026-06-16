const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Voucher = sequelize.define('Voucher', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  voucherNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  type: {
    type: DataTypes.ENUM('Sales', 'Purchase', 'Receipt', 'Payment'),
    allowNull: false,
  },
  partyName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('DUE', 'PAID', 'PARTIAL'),
    allowNull: false,
    defaultValue: 'DUE',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  gstRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 18.00,
  },
  gstAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  terms: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Voucher;
