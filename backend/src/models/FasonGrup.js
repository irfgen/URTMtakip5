const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class FasonGrup extends Model {
  static associate(models) {
    // Fason iş emirleri ile ilişki - bir grup birden fazla fason iş emri içerebilir
    FasonGrup.hasMany(models.FasonIsEmri, {
      foreignKey: 'fason_grup_id',
      as: 'fason_is_emirleri'
    });
  }
}

FasonGrup.init({
  fason_grup_id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'fason_grup_id'
  },
  grup_adi: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'grup_adi'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'aciklama'
  },
  renk: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#1976d2',
    field: 'renk'
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'aktif'
  },
  toplam_parca_sayisi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'toplam_parca_sayisi'
  },
  olusturan_kisi: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'olusturan_kisi'
  },
  olusturma_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'olusturma_tarihi'
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'guncelleme_tarihi'
  }
}, {
  sequelize,
  modelName: 'FasonGrup',
  tableName: 'fason_gruplar',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = FasonGrup;
