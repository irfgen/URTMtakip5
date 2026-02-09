const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class Fason extends Model {
  static associate(models) {
    // Fason ile ilişkiler burada tanımlanabilir
  }
}

Fason.init({
  fason_id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'fason_id'
  },
  is_emri_no: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'is_emri_no'
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'parca_kodu',
    references: {
      model: 'parcalar',
      key: 'parca_kodu'
    }
  },
  parca_adi: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'parca_adi'
  },
  adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'adet'
  },
  tedarikci: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'tedarikci'
  },
  baslangic_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'baslangic_tarihi'
  },
  teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'teslim_tarihi'
  },
  durum: {
    type: DataTypes.ENUM('beklemede', 'devam', 'tamamlandi', 'iptal'),
    allowNull: false,
    defaultValue: 'beklemede',
    field: 'durum'
  },
  maliyet: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'maliyet'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'aciklama'
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
  modelName: 'Fason',
  tableName: 'fasonlar',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = Fason;