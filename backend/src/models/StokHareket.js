const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class StokHareket extends Model {
  static associate(models) {
    // StokHareket belongs to Satis
    StokHareket.belongsTo(models.Satis, {
      foreignKey: 'satis_id',
      targetKey: 'id',
      as: 'satis'
    });

    // StokHareket belongs to Parca
    StokHareket.belongsTo(models.Parca, {
      foreignKey: 'parca_kodu',
      targetKey: 'parcaKodu',
      as: 'parca'
    });
  }
}

StokHareket.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  satis_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'satis_id',
    comment: 'Satış kaydı referansı'
  },
  parca_kodu: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'parca_kodu',
    comment: 'Parça kodu'
  },
  parca_adi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'parca_adi',
    comment: 'Parça adı'
  },
  bom_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'bom_id',
    comment: 'BOM ID'
  },
  bom_adi: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'bom_adi',
    comment: 'BOM adı'
  },
  birim_miktar: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'birim_miktar',
    comment: 'BOM içindeki birim miktar'
  },
  satis_adedi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'satis_adedi',
    comment: 'Satılan makina adedi'
  },
  dusulen_miktar: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'dusulen_miktar',
    comment: 'Düşülen toplam miktar (birim_miktar × satis_adedi)'
  },
  onceki_stok: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'onceki_stok',
    comment: 'Stok düşmeden önceki miktar'
  },
  sonraki_stok: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sonraki_stok',
    comment: 'Stok düşmeden sonraki miktar'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  sequelize,
  modelName: 'StokHareket',
  tableName: 'stok_hareketleri',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = StokHareket;
