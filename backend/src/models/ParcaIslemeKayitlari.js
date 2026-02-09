/**
 * Parça İşleme Kayıtları Model
 *
 * Bu model, ESP32 cihazlarından gelen parça işleme
 * sürelerini takip eder.
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2025-08-03
 */

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class ParcaIslemeKayitlari extends Model {
  static associate(models) {
    // ParcaIslemeKayitlari belongs to Tezgah
    ParcaIslemeKayitlari.belongsTo(models.Tezgah, {
      foreignKey: 'tezgah_id',
      as: 'tezgah'
    });

    // ParcaIslemeKayitlari belongs to IsEmri
    ParcaIslemeKayitlari.belongsTo(models.IsEmri, {
      foreignKey: 'is_emri_id',
      as: 'is_emri'
    });
  }
}

ParcaIslemeKayitlari.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  tezgah_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tezgahlar',
      key: 'tezgah_id'
    }
  },
  is_emri_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'is_emirleri',
      key: 'is_emri_id'
    }
  },
  baslangic_zamani: {
    type: DataTypes.DATE,
    allowNull: false
  },
  bitis_zamani: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isleme_suresi_dakika: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'İşleme süresi (dakika cinsinden)'
  },
  kayit_zamani: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  esp32_kayit_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'ParcaIslemeKayitlari',
  tableName: 'parca_isleme_kayitlari',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_pik_tezgah_id',
      fields: ['tezgah_id']
    },
    {
      name: 'idx_pik_is_emri_id',
      fields: ['is_emri_id']
    },
    {
      name: 'idx_pik_baslangic_zamani',
      fields: ['baslangic_zamani']
    },
    {
      name: 'idx_pik_is_emri_baslangic',
      fields: ['is_emri_id', 'baslangic_zamani']
    },
    {
      name: 'idx_pik_esp32_kayit_id',
      fields: ['esp32_kayit_id']
    }
  ]
});

module.exports = ParcaIslemeKayitlari;
