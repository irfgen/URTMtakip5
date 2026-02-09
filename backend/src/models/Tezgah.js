const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class Tezgah extends Model {
  static associate(models) {
    if (models.TamamlananIs) {
      Tezgah.hasMany(models.TamamlananIs, {
        foreignKey: 'tezgah_id',
        as: 'tamamlananIsler'
      });
    }
    
    // Yeni Scheduler ilişkisi
    Tezgah.hasMany(models.TezgahZamanPlani, { 
      foreignKey: 'tezgah_id', 
      as: 'zaman_planlari' 
    });
  }
}

Tezgah.init({
  tezgah_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tezgah_tanimi: { type: DataTypes.STRING, allowNull: false },
  calisma_durumu: { type: DataTypes.ENUM('musait', 'calisiyor', 'bakim'), defaultValue: 'musait' },
  is_emirleri: { type: DataTypes.JSON, defaultValue: [], comment: 'Tezgaha atanmış iş emirleri listesi' },
  is_emirleri_gecmisi: { type: DataTypes.JSON, defaultValue: [], comment: 'Tezgahın geçmiş iş emirleri ve detaylı bilgileri' },
  pozisyon_x: { type: DataTypes.INTEGER, defaultValue: 0 },
  pozisyon_y: { type: DataTypes.INTEGER, defaultValue: 0 },
  genislik: { type: DataTypes.INTEGER, defaultValue: 200, comment: 'Tezgah kartı genişliği (px)' },
  yukseklik: { type: DataTypes.INTEGER, defaultValue: 120, comment: 'Tezgah kartı yüksekliği (px)' },
  son_bakim_tarihi: { type: DataTypes.DATE, allowNull: true },
  sonraki_bakim_tarihi: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  modelName: 'Tezgah',
  tableName: 'tezgahlar',
  timestamps: true
});

module.exports = Tezgah;