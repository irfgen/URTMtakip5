const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class IsEmriDurum extends Model {
  static associate(models) {
    // İş Emirleri ile ilişki
    IsEmriDurum.hasMany(models.IsEmri, { foreignKey: 'durum', sourceKey: 'durum_kodu', as: 'is_emirleri' });
  }
}

IsEmriDurum.init({
  durum_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  durum_kodu: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: 'İş emri durum kodu (örn: beklemede, freze, torna)'
  },
  durum_adi: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'İş emri durum adı (görüntülenen ad)'
  },
  durum_aciklamasi: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Durum hakkında açıklama'
  },
  renk_kodu: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#1976d2',
    comment: 'Durum renk kodu (hex format, örn: #1976d2)'
  },
  sira_no: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 999,
    comment: 'Durumların sıralanma numarası'
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Durum aktif mi?'
  },
  sistem_durumu: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Sistem durumu mu? (varsayılan durumlar silinemez)'
  }
}, {
  sequelize,
  modelName: 'IsEmriDurum',
  tableName: 'is_emri_durumlari',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = IsEmriDurum;