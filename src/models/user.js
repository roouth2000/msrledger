const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isAlphanumeric: true,
      len: [3, 30],
    },
  },
  shopName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100],
    },
  },
  ownerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  gstin: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isGstin(value) {
        if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(value)) {
          throw new Error('Invalid GSTIN format');
        }
      }
    },
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^\+?[0-9]{10,15}$/,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

// Helper instance method to verify password
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
