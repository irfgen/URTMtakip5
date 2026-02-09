const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

/**
 * Uygunsuzluk İnceleme Notları Modeli
 *
 * Raporların incelenmesi sırasında sorumlular tarafından eklenen
 * zaman damgalı notlar.
 */
class UygunsuzlukNotlari extends Model {
  static associate(models) {
    UygunsuzlukNotlari.belongsTo(models.UygunsuzlukRaporlari, {
      foreignKey: 'rapor_id',
      constraints: false,
      as: 'rapor'
    });
    UygunsuzlukNotlari.belongsTo(models.Personel, {
      foreignKey: 'yazan_id',
      constraints: false,
      as: 'yazan'
    });
  }
}

UygunsuzlukNotlari.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rapor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  yazan_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  not: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'UygunsuzlukNotlari',
  tableName: 'uygunsuzluk_notlari',
  timestamps: false,
  updatedAt: false,
  indexes: [
    {
      fields: ['rapor_id']
    },
    {
      fields: ['yazan_id']
    }
    // createdAt index'i kaldırıldı - SQLite uyumluluğu için
  ]
});

module.exports = UygunsuzlukNotlari;
