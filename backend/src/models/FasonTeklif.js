const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class FasonTeklif extends Model {
  static associate(models) {
    FasonTeklif.belongsTo(models.Parca, {
      foreignKey: 'parca_kodu',
      targetKey: 'parcaKodu',
      as: 'parca'
    });
    // ...varsa diğer ilişkiler...
  }
}

FasonTeklif.init({
  teklif_id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'teklif_id'
  },
  fason_is_emri_id: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'fason_is_emri_id',
    references: {
      model: 'fason_is_emirleri',
      key: 'fason_is_emri_id'
    }
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'parca_kodu',
    references: {
      model: 'parcalar',
      key: 'parca_kodu'
    }
  },
  tedarikci: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'tedarikci'
  },
  teklif_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'teklif_tarihi'
  },
  teklif_fiyati: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'teklif_fiyati'
  },
  teslim_suresi: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'teslim_suresi'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'aciklama'
  },
  durumu: {
    type: DataTypes.ENUM('aktif', 'kabul_edildi', 'reddedildi'),
    allowNull: false,
    defaultValue: 'aktif',
    field: 'durumu'
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
  modelName: 'FasonTeklif',
  tableName: 'fason_teklifler',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = FasonTeklif;
