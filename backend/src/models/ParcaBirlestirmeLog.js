const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class ParcaBirlestirmeLog extends Model {
  static associate(models) {
    // Birleştirilen parça ile ilişki
    ParcaBirlestirmeLog.belongsTo(models.Parca, {
      foreignKey: 'tutulan_parca_kodu',
      targetKey: 'parcaKodu',
      as: 'tutulanParca'
    });
  }
}

ParcaBirlestirmeLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tutulan_parca_kodu: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'parcalar',
      key: 'parca_kodu'
    },
    comment: 'Birleştirmede tutulan parça kodu'
  },
  silinen_parca_kodlari: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Silinen parça kodları listesi (JSON array)'
  },
  transfer_detaylari: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Transfer edilen veri detayları (JSON object)'
  },
  onceki_durum: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Birleştirme öncesi parça durumları (rollback için)'
  },
  kullanici_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'İşlemi yapan kullanıcı ID'
  },
  kullanici_ip: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'İşlemin yapıldığı IP adresi'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Birleştirme ile ilgili açıklama'
  },
  rollback_durumu: {
    type: DataTypes.ENUM('aktif', 'geri_alindi', 'geri_alinamaz'),
    defaultValue: 'aktif',
    comment: 'Geri alma durumu'
  },
  rollback_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Geri alma tarihi'
  },
  rollback_kullanici_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Geri alma işlemini yapan kullanıcı'
  }
}, {
  sequelize,
  modelName: 'ParcaBirlestirmeLog',
  tableName: 'parca_birlestirme_log',
  timestamps: true,
  paranoid: false, // Soft delete kullanma, log kayıtları kalıcı olsun
  indexes: [
    {
      fields: ['tutulan_parca_kodu']
    },
    {
      fields: ['rollback_durumu']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = ParcaBirlestirmeLog;