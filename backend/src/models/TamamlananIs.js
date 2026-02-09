const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class TamamlananIs extends Model {
  static associate(models) {
    TamamlananIs.belongsTo(models.Tezgah, {
      foreignKey: 'tezgah_id',
      as: 'tezgah'
    });
    // Diğer ilişkiler burada tanımlanabilir
  }
}

TamamlananIs.init({
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
  is_emri_no: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_adi: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parca_adi: {
    type: DataTypes.STRING,
    allowNull: true
  },
  plan_liste_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  baslama_tarihi: {
    type: DataTypes.DATE,
    allowNull: true
  },
  bitis_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  toplam_adet: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  islenen_adet: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  toplam_sure: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'TamamlananIs',
  tableName: 'tamamlanan_isler',
  timestamps: true
});

module.exports = TamamlananIs;
