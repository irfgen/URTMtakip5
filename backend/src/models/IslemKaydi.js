const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class IslemKaydi extends Model {
  static associate(models) {
    IslemKaydi.belongsTo(models.IsEmri, { foreignKey: 'is_emri_no', targetKey: 'is_emri_no', as: 'is_emri' });
    IslemKaydi.belongsTo(models.Tezgah, { foreignKey: 'tezgah_id', as: 'tezgah' });
    // ✅ FASON ENTEGRASYONu: Fason iş emri ile ilişki
    IslemKaydi.belongsTo(models.FasonIsEmri, { foreignKey: 'fason_is_emri_id', as: 'fason_is_emri' });
  }
}

IslemKaydi.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  is_emri_no: { type: DataTypes.STRING, allowNull: false },
  tezgah_id: { type: DataTypes.INTEGER, allowNull: true }, // Fason işlemler için null olabilir
  islem_tipi: { type: DataTypes.TEXT, allowNull: false },
  islem_tarihi: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  islenen_adet: { type: DataTypes.INTEGER, allowNull: true },
  aciklama: { type: DataTypes.TEXT, allowNull: true },
  // ✅ FASON ENTEGRASYONu: Yeni alanlar
  fason_is_emri_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Fason iş emri ID\'si (fason işlemler için)'
  },
  islem_yeri: {
    type: DataTypes.ENUM('tezgah', 'fason'),
    defaultValue: 'tezgah',
    allowNull: false,
    comment: 'İşlemin yapıldığı yer (tezgah/fason)'
  },
  fason_tedarikci: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Fason tedarikçi adı'
  }
}, {
  sequelize,
  modelName: 'IslemKaydi',
  tableName: 'islem_kayitlari',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = IslemKaydi;
