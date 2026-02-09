const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class UretimPlani extends Model {
  static associate(models) {
    UretimPlani.belongsTo(models.Makina, {
      foreignKey: 'makina_id',
      targetKey: 'makina_id',
      as: 'makina'
    });
    UretimPlani.hasMany(models.IsEmri, {
      foreignKey: 'uretim_plani_id',
      sourceKey: 'id',
      as: 'is_emirleri'
    });
    // Fason iş emirleri ile ilişki
    UretimPlani.hasMany(models.FasonIsEmri, {
      foreignKey: 'uretim_plani_id',
      as: 'fason_is_emirleri'
    });
  }
}

UretimPlani.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  makina_id: {
    type: DataTypes.UUID,
    allowNull: true, // Özel liste için null değerine izin verilmeli
    comment: 'İmal edilecek makina ID (özel liste için null olabilir)',
    references: { model: 'makinalar', key: 'makina_id' }
  },
  miktar: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: 'İmal edilecek makina adedi' },
  teslim_tarihi: { type: DataTypes.DATE, allowNull: false, comment: 'Teslim tarihi' },
  durum: {
    type: DataTypes.ENUM('Planlandı', 'Üretimde', 'Tamamlandı', 'İptal'),
    defaultValue: 'Planlandı',
    comment: 'Üretim planı durumu'
  },
  aciklama: { type: DataTypes.TEXT, allowNull: true, comment: 'Açıklama ve notlar' },
  bom_snapshot: { type: DataTypes.JSON, allowNull: true, comment: 'Üretim planı oluşturulduğundaki BOM snapshot' },
  kritik_stok_uyarisi: { type: DataTypes.JSON, allowNull: true, comment: 'Kritik stok uyarısı olan parçalar' },
  ozel_liste_adi: { type: DataTypes.STRING, allowNull: true, comment: 'Kullanıcı tarafından verilen özel üretim planı liste adı' }
}, {
  sequelize,
  modelName: 'UretimPlani',
  tableName: 'uretim_plani',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = UretimPlani;