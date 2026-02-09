const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class ArizaBakim extends Model {
  static associate(models) {
    ArizaBakim.belongsTo(models.Tezgah, { foreignKey: 'tezgah_id', as: 'tezgah' });
    if (models.Tezgah) {
      models.Tezgah.hasMany(ArizaBakim, { foreignKey: 'tezgah_id', as: 'ariza_bakim' });
    }
  }
}

ArizaBakim.init({
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
  kayit_tipi: {
    type: DataTypes.ENUM('ariza', 'bakim'),
    allowNull: false
  },
  baslangic_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  bitis_tarihi: {
    type: DataTypes.DATE,
    allowNull: true
  },
  durum: {
    type: DataTypes.ENUM('devam_ediyor', 'tamamlandi'),
    allowNull: false,
    defaultValue: 'devam_ediyor'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  yapilan_islemler: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  maliyet: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  sorumlu: {
    type: DataTypes.STRING,
    allowNull: true
  },
  olusturma_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'olusturma_tarihi'
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'guncelleme_tarihi'
  }
}, {
  sequelize,
  modelName: 'ArizaBakim',
  tableName: 'ariza_bakim',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = ArizaBakim;