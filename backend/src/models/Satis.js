const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class Satis extends Model {
  static associate(models) {
    // Satis has many StokHareket
    Satis.hasMany(models.StokHareket, {
      foreignKey: 'satis_id',
      sourceKey: 'id',
      as: 'hareketler'
    });

    // Satis belongs to Makina
    Satis.belongsTo(models.Makina, {
      foreignKey: 'makina_id',
      targetKey: 'makina_id',
      as: 'makina'
    });
  }
}

Satis.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  makina_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'makina_id',
    comment: 'Satılan makina UUID'
  },
  makina_adi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'makina_adi',
    comment: 'Redundant ama hızlı sorgu için'
  },
  satis_adedi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'satis_adedi',
    comment: 'Kaç adet makina satıldı'
  },
  toplam_parca: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'toplam_parca',
    comment: 'Kaç farklı parça stoktan düştü'
  },
  toplam_stok_dusulen: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'toplam_stok_dusulen',
    comment: 'Toplam kaç adet parça düşüldü'
  },
  durum: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'tamamlandi',
    field: 'durum',
    comment: 'Satış durumu'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'aciklama',
    comment: 'Opsiyonel not'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  sequelize,
  modelName: 'Satis',
  tableName: 'satislar',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = Satis;
