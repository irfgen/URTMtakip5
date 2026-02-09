const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class IsEmriOzet extends Model {
  static associate(models) {
    IsEmriOzet.belongsTo(models.IsEmri, { foreignKey: 'is_emri_id', as: 'is_emri' });
  }
}

IsEmriOzet.init({
  ozet_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  is_emri_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  is_adi: {
    type: DataTypes.STRING,
    allowNull: true
  },
  baslangic_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  },
  bitis_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  },
  toplam_calisma_suresi: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  toplam_durus_suresi: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ara_verme_sayisi: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  toplam_uretilen: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hurda_sayisi: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ortalama_parca_suresi: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  verimlilik: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  operator_notu: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  durus_detaylari: {
    type: DataTypes.JSON,
    allowNull: true
  },
  onaylayan_kullanici: {
    type: DataTypes.STRING,
    allowNull: true
  },
  onay_tarihi: {
    type: DataTypes.DATE,
    allowNull: true
  },
  setup_sayisi: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  cnc_suresi: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  uretim_sonucu: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'IsEmriOzet',
  tableName: 'is_emri_ozetleri',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = IsEmriOzet;
