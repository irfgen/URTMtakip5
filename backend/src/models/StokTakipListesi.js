const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class StokTakipListesi extends Model {
  static associate(models) {
    // İlişki tanımı gerekmiyor; kalemler JSON olarak saklanıyor
  }
}

StokTakipListesi.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  ad: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Liste adı boş olamaz' },
      len: { args: [1, 255], msg: 'Liste adı 1-255 karakter olmalı' }
    },
    comment: 'Stok takip listesi adı'
  },
  kalemler: {
    // Not: SQLite için JSON TEXT olarak saklanır, PostgreSQL için JSONB kullanılabilir
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Liste kalemleri: [{ stok_karti_id, adet, not }]'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  olusturma_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'StokTakipListesi',
  tableName: 'stok_takip_listeleri',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi',
  hooks: {
    beforeSave: (liste) => {
      liste.guncelleme_tarihi = new Date();
      if (!Array.isArray(liste.kalemler)) {
        liste.kalemler = [];
      }
    }
  }
});

module.exports = StokTakipListesi;


