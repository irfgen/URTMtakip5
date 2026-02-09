const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VardiyaAtama = sequelize.define('VardiyaAtama', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  personel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Personel ID'
  },
  vardiya_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Vardiya ID'
  },
  tarih: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Atama tarihi'
  },
  baslangic_saati: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Özel başlangıç saati (vardiya saatinden farklıysa)'
  },
  bitis_saati: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Özel bitiş saati (vardiya saatinden farklıysa)'
  },
  durum: {
    type: DataTypes.ENUM('planlanan', 'aktif', 'tamamlandi', 'iptal'),
    allowNull: false,
    defaultValue: 'planlanan',
    comment: 'Atama durumu'
  },
  fiili_baslangic: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fiili başlangıç zamanı'
  },
  fiili_bitis: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fiili bitiş zamanı'
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Atama notları'
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
  tableName: 'vardiya_atamalari',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi',
  indexes: [
    {
      unique: true,
      fields: ['personel_id', 'tarih']
    }
  ]
});

// İlişkileri tanımla
VardiyaAtama.associate = function(models) {
  // VardiyaAtama'nın bir personeli vardır
  VardiyaAtama.belongsTo(models.Personel, {
    foreignKey: 'personel_id',
    as: 'personel'
  });
  
  // VardiyaAtama'nın bir vardiyası vardır
  VardiyaAtama.belongsTo(models.Vardiya, {
    foreignKey: 'vardiya_id',
    as: 'vardiya'
  });
};

module.exports = VardiyaAtama;
