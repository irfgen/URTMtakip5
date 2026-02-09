const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class UretimPlaniV2 extends Model {}

UretimPlaniV2.init({
  uretim_plani_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  uretim_plani_adi: { type: DataTypes.STRING, allowNull: false },
  is_emirleri_listesi: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  teslim_tarihi: { type: DataTypes.DATE, allowNull: false },
  durum: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Planlandı' },
  aciklama: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  modelName: 'UretimPlaniV2',
  tableName: 'uretim_planlari',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = UretimPlaniV2;


