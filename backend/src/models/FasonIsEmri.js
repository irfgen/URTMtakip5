const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class FasonIsEmri extends Model {
  static associate(models) {
    FasonIsEmri.belongsTo(models.Parca, {
      foreignKey: 'parca_kodu',
      targetKey: 'parcaKodu',
      as: 'parca'
    });
    FasonIsEmri.hasMany(models.FasonTeklif, {
      foreignKey: 'fason_is_emri_id',
      sourceKey: 'fason_is_emri_id',
      as: 'teklifler'
    });
    FasonIsEmri.belongsTo(models.FasonGrup, {
      foreignKey: 'fason_grup_id',
      as: 'fason_grup'
    });
    // Üretim planı ile ilişki
    FasonIsEmri.belongsTo(models.UretimPlani, {
      foreignKey: 'uretim_plani_id',
      as: 'uretim_plani'
    });
    // İş emri ile ilişki
    FasonIsEmri.belongsTo(models.IsEmri, {
      foreignKey: 'is_emri_id',
      as: 'is_emri'
    });
    // ...varsa diğer ilişkiler...
  }
}

FasonIsEmri.init({
  fason_is_emri_id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'fason_is_emri_id'
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'parca_kodu',
    references: {
      model: 'parcalar',
      key: 'parcaKodu'
    }
  },
  fason_grup_id: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'fason_grup_id',
    references: {
      model: 'fason_gruplar',
      key: 'fason_grup_id'
    }
  },
  uretim_plani_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'uretim_plani_id',
    references: {
      model: 'uretim_plani',
      key: 'id'
    },
    comment: 'Fason iş emrinin bağlı olduğu üretim planı ID\'si'
  },
  is_emri_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'is_emri_id',
    references: {
      model: 'is_emirleri',
      key: 'is_emri_id'
    },
    comment: 'Fason iş emrinin türetildiği ana iş emri ID\'si'
  },
  fason_adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'fason_adet'
  },
  teslim_adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'teslim_adet'
  },
  verilis_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'verilis_tarihi'
  },
  teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'teslim_tarihi'
  },
  gercek_teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'gercek_teslim_tarihi'
  },
  ilgili_kisi: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'ilgili_kisi'
  },
  tedarikci: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'tedarikci'
  },
  durum: {
    type: DataTypes.ENUM('beklemede', 'uretimde', 'tamamlandi', 'iptal'),
    allowNull: false,
    defaultValue: 'beklemede',
    field: 'durum'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'aciklama'
  },
  toplam_maliyet: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'toplam_maliyet'
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
  },
  // Ham malzeme takip alanları
  ham_malzeme_gonderim_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ham_malzeme_gonderim_tarihi'
  },
  ham_malzeme_durumu: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'gönderilmedi',
    field: 'ham_malzeme_durumu'
  },
  ham_malzeme_miktari: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    field: 'ham_malzeme_miktari'
  },
  gonderim_irsaliye_no: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'gonderim_irsaliye_no'
  },
  gonderen_kisi: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'gonderen_kisi'
  },
  ham_malzeme_notlar: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ham_malzeme_notlar'
  },
  ham_malzeme_teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ham_malzeme_teslim_tarihi'
  },
  ham_malzeme_teslim_sorumlusu: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ham_malzeme_teslim_sorumlusu'
  },
  teslim_notlari: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'teslim_notlari'
  }
}, {
  sequelize,
  modelName: 'FasonIsEmri',
  tableName: 'fason_is_emirleri',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = FasonIsEmri;
