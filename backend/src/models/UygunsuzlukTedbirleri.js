const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

/**
 * Uygunsuzluk Tedbirleri Modeli
 *
 * Raporların kapatılması için alınan düzeltici ve önleyici tedbirler.
 */
class UygunsuzlukTedbirleri extends Model {
  static associate(models) {
    UygunsuzlukTedbirleri.belongsTo(models.UygunsuzlukRaporlari, {
      foreignKey: 'rapor_id',
      constraints: false,
      as: 'rapor'
    });
  }
}

UygunsuzlukTedbirleri.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rapor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tedbir_turu: {
    type: DataTypes.ENUM('duzeltici', 'onleyici', 'her_ikisi'),
    allowNull: false,
    defaultValue: 'duzeltici'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  durum: {
    type: DataTypes.ENUM('planlandı', 'devam_ediyor', 'tamamlandi'),
    allowNull: false,
    defaultValue: 'planlandı'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'UygunsuzlukTedbirleri',
  tableName: 'uygunsuzluk_tedbirleri',
  timestamps: false,
  updatedAt: false,
  indexes: [
    {
      fields: ['rapor_id']
    },
    {
      fields: ['tedbir_turu']
    },
    {
      fields: ['durum']
    }
  ]
});

module.exports = UygunsuzlukTedbirleri;
