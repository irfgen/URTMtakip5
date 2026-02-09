const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class TezgahDurumLog extends Model {
  static associate(models) {
    // İlişkileri tanımla
    TezgahDurumLog.belongsTo(models.Tezgah, {
      foreignKey: 'tezgah_id',
      as: 'tezgah'
    });
    
    TezgahDurumLog.belongsTo(models.IsEmri, {
      foreignKey: 'is_emri_id',
      as: 'isEmri'
    });
  }
}

TezgahDurumLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    allowNull: true, // Tezgah boşta olduğunda is_emri_id null olabilir
    references: {
      model: 'is_emirleri',
      key: 'is_emri_id'
    }
  },
  durum: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'true = çalışıyor, false = durdu'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  durus_nedeni: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Duruş nedeni (ör: Bakım, Arıza, Malzeme Bekleme, Operatör Yok, Setup, Diğer)'
  }
}, {
  sequelize,
  modelName: 'TezgahDurumLog',
  tableName: 'tezgah_durum_logs',
  timestamps: true // createdAt ve updatedAt alanlarını otomatik ekler
});

module.exports = TezgahDurumLog;
