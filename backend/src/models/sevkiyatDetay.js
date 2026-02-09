module.exports = (sequelize, DataTypes) => {
  const SevkiyatDetay = sequelize.define('SevkiyatDetay', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sevkiyat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sevkiyats',
        key: 'id'
      }
    },
    parca_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'parcas',
        key: 'id'
      }
    },
    miktar: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    birim_fiyat: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    talep_detay_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tedarik_talebi_detays',
        key: 'id'
      }
    }
  }, {
    tableName: 'sevkiyat_detays',
    timestamps: true,
    createdAt: 'olusturma_tarihi',
    updatedAt: 'guncelleme_tarihi'
  });

  SevkiyatDetay.associate = function(models) {
    SevkiyatDetay.belongsTo(models.Sevkiyat, { foreignKey: 'sevkiyat_id', as: 'sevkiyat' });
    SevkiyatDetay.belongsTo(models.Parca, { foreignKey: 'parca_id', as: 'parca' });
    // TedarikTalebiDetay modeli yok, bu ilişki kaldırıldı
  };

  return SevkiyatDetay;
};