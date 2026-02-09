const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Personel = sequelize.define('Personel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  personel_adi: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Personel adı soyadı'
  },
  sicil_no: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: 'Personel sicil numarası'
  },
  pozisyon: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Personel pozisyonu (Operatör, Usta, vb.)'
  },
  telefon: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Telefon numarası'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'E-posta adresi'
  },
  vardiya_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Varsayılan vardiya ID'
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Personel aktif mi?'
  },
  maas: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Personel maaşı'
  },
  ise_baslama_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'İşe başlama tarihi'
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Personel hakkında notlar'
  },
  olusturma_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  modelName: 'Personel',
  tableName: 'personeller',
  underscored: false,
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

// İlişkileri tanımla
Personel.associate = function(models) {
  // Personel'in bir vardiyası olabilir
  Personel.belongsTo(models.Vardiya, {
    foreignKey: 'vardiya_id',
    as: 'vardiya'
  });
  
  // Personel'in birçok atama kaydı olabilir
  Personel.hasMany(models.VardiyaAtama, {
    foreignKey: 'personel_id',
    as: 'atamalari'
  });
};

module.exports = Personel;
