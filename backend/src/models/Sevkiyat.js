const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sevkiyat = sequelize.define('Sevkiyat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sevkiyat_no: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tip: {
    type: DataTypes.ENUM('gelen', 'giden'),
    allowNull: false,
    defaultValue: 'gelen'
  },
  firma_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lokasyon_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nereden_lokasyon_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  nereye_lokasyon_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tarih: {
    type: DataTypes.DATE,
    allowNull: false
  },
  durum: {
    type: DataTypes.ENUM('beklemede', 'yolda', 'tamamlandi'),
    allowNull: false,
    defaultValue: 'beklemede'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  olusturan_kullanici: {
    type: DataTypes.STRING,
    allowNull: false
  },
  olusturma_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tedarik_talebi_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'sevkiyatlar',
  timestamps: false,
  indexes: [
    {
      fields: ['tarih']
    },
    {
      fields: ['firma_id']
    },
    {
      fields: ['durum']
    },
    {
      fields: ['tedarik_talebi_id']
    }
  ]
});

// İlişkiler
Sevkiyat.associate = (models) => {
  // Firma ilişkisi - artık firmalar tablosuna bağlanıyor
  if (models.Firma) {
    Sevkiyat.belongsTo(models.Firma, {
      foreignKey: 'firma_id',
      as: 'firma'
    });
  }

  // Lokasyon ilişkileri
  if (models.SevkiyatLokasyon) {
    Sevkiyat.belongsTo(models.SevkiyatLokasyon, {
      foreignKey: 'lokasyon_id',
      as: 'lokasyon'
    });
  }

  // Kalemler ilişkisi
  if (models.SevkiyatKalem) {
    Sevkiyat.hasMany(models.SevkiyatKalem, {
      foreignKey: 'sevkiyat_id',
      as: 'kalemler'
    });
  }

  // Tedarik talebi ilişkisi
  if (models.TedarikTalebi) {
    Sevkiyat.belongsTo(models.TedarikTalebi, {
      foreignKey: 'tedarik_talebi_id',
      as: 'tedarikTalebi'
    });
  }
};

module.exports = Sevkiyat;