const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class TezgahPlanlananIsler extends Model {
  static associate(models) {
    TezgahPlanlananIsler.belongsTo(models.Tezgah, {
      foreignKey: 'tezgah_id',
      as: 'tezgah'
    });
    TezgahPlanlananIsler.belongsTo(models.IsEmri, {
      foreignKey: 'is_emri_id',
      as: 'isEmri'
    });
  }
}

TezgahPlanlananIsler.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tezgah_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_emri_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sira_no: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 9999 // Yeni eklenen elemanlara varsayılan olarak büyük bir sıra numarası
  }
}, {
  sequelize,
  modelName: 'TezgahPlanlananIsler',
  tableName: 'tezgah_planlanan_isler',
  timestamps: true
});

module.exports = TezgahPlanlananIsler;
