const { DataTypes } = require('sequelize');

const { sequelize } = require('../config/database');
const SiparisDokumani = sequelize.define('SiparisDokumani', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  is_emri_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dosya_yolu: {
    type: DataTypes.STRING,
    allowNull: false
  },
  yuklenme_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  siralama: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'siparis_dokumanlari',
  timestamps: false
});

module.exports = SiparisDokumani;
