const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

/**
 * Uygunsuzluk Dosyaları Modeli
 *
 * Raporlara eklenen resim, PDF ve diğer dosyalar.
 */
class UygunsuzlukDosyalari extends Model {
  static associate(models) {
    UygunsuzlukDosyalari.belongsTo(models.UygunsuzlukRaporlari, {
      foreignKey: 'rapor_id',
      constraints: false,
      as: 'rapor'
    });
    UygunsuzlukDosyalari.belongsTo(models.Personel, {
      foreignKey: 'yukleyen_id',
      constraints: false,
      as: 'yukleyen'
    });
  }
}

UygunsuzlukDosyalari.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rapor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dosya_adi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dosya_yolu: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dosya_tipi: {
    type: DataTypes.ENUM('resim', 'pdf', 'doc', 'diger'),
    allowNull: false,
    defaultValue: 'diger'
  },
  yukleyen_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'UygunsuzlukDosyalari',
  tableName: 'uygunsuzluk_dosyalari',
  timestamps: false,
  updatedAt: false,
  indexes: [
    {
      fields: ['rapor_id']
    },
    {
      fields: ['dosya_tipi']
    },
    {
      fields: ['yukleyen_id']
    }
  ]
});

module.exports = UygunsuzlukDosyalari;
