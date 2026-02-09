const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vardiya = sequelize.define('Vardiya', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vardiya_adi: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Vardiya adı (örn: Gündüz, Gece, 1. Vardiya)'
  },
  baslangic_saati: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Vardiya başlangıç saati'
  },
  bitis_saati: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Vardiya bitiş saati'
  },
  haftalik_calisma_gunleri: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [1, 2, 3, 4, 5], // Pazartesi=1, Salı=2, ... Pazar=7
    comment: 'Haftalık çalışma günleri array olarak (1-7)'
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Vardiya aktif mi?'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Vardiya açıklaması'
  },
  renk: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#1976d2',
    comment: 'Vardiya rengi (hex kod)'
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
  tableName: 'vardiyalar',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

// İlişkileri tanımla
Vardiya.associate = function(models) {
  // Vardiya'nın birçok personeli olabilir
  Vardiya.hasMany(models.Personel, {
    foreignKey: 'vardiya_id',
    as: 'personeller'
  });
  
  // Vardiya'nın birçok atama kaydı olabilir
  Vardiya.hasMany(models.VardiyaAtama, {
    foreignKey: 'vardiya_id',
    as: 'atamalari'
  });
};

module.exports = Vardiya;
