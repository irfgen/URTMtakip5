const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SevkiyatKalem = sequelize.define('SevkiyatKalem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sevkiyat_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  kalem_tipi: {
    type: DataTypes.ENUM('stok_karti', 'parca'),
    allowNull: false
  },
  stok_karti_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: true
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  miktar: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1
  },
    resimler: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('resimler');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('resimler', JSON.stringify(value));
    }
  }
}, {
  tableName: 'sevkiyat_kalemleri',
  timestamps: false,
  indexes: [
    {
      fields: ['sevkiyat_id']
    },
    {
      fields: ['stok_karti_id']
    },
    {
      fields: ['parca_kodu']
    }
  ]
});

module.exports = SevkiyatKalem;