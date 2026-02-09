const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class ParcaKayitlari extends Model {
  static associate(models) {
    // ParcaKayitlari belongs to Parca
    ParcaKayitlari.belongsTo(models.Parca, {
      foreignKey: 'parca_kodu',
      targetKey: 'parcaKodu',
      as: 'parca'
    });
  }
}

ParcaKayitlari.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  parcaKodu: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'parca_kodu',
    references: {
      model: 'parcalar',
      key: 'parca_kodu'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  dosyaYolu: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'dosya_yolu',
    comment: 'Dosya yolu'
  },
  kayitZamani: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'kayit_zamani',
    comment: 'Kayıt zamanı'
  },
  siraNo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'sira_no',
    comment: 'Sıra numarası'
  },
  not: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'not',
    comment: 'Notlar'
  }
}, {
  sequelize,
  modelName: 'ParcaKayitlari',
  tableName: 'parca_kayitlari',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['parca_kodu']
    },
    {
      fields: ['kayit_zamani']
    },
    {
      fields: ['parca_kodu', 'sira_no']
    }
  ]
});

module.exports = ParcaKayitlari;
