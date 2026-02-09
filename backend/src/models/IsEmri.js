const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class IsEmri extends Model {
  static associate(models) {
    // İşlem kaydı ve özet ilişkilerinde foreignKey olarak is_emri_id kullanılmalı
    IsEmri.hasMany(models.IslemKaydi, { foreignKey: 'is_emri_no', as: 'islem_kayitlari' });
    IsEmri.hasOne(models.IsEmriOzet, { foreignKey: 'is_emri_id', as: 'ozet' });
    IsEmri.belongsTo(models.Tezgah, { foreignKey: 'tezgah_id', as: 'tezgah' });
    IsEmri.belongsTo(models.UretimPlani, { foreignKey: 'uretim_plani_id', as: 'uretim_plani' });
    IsEmri.belongsTo(models.Parca, { foreignKey: 'parca_kodu', as: 'parca' });
    IsEmri.hasMany(models.FasonIsEmri, { foreignKey: 'is_emri_id', as: 'fason_is_emirleri' });
    
    // Yeni Scheduler ilişkisi
    IsEmri.hasMany(models.TezgahZamanPlani, { foreignKey: 'is_emri_id', as: 'zaman_planlari' });
  }
}

IsEmri.init({
  is_emri_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  is_emri_no: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  is_adi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  plan_liste_no: {
    type: DataTypes.STRING,
    allowNull: false
  },
  adet: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  malzeme: {
    type: DataTypes.STRING,
    allowNull: false
  },
  teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  },
  oncelik: {
    type: DataTypes.ENUM('dusuk', 'normal', 'yuksek', 'acil'),
    defaultValue: 'normal'
  },
  durum: {
    type: DataTypes.STRING,
    defaultValue: 'beklemede',
    allowNull: false,
    validate: {
      async isValidDurum(value) {
        // Dinamik durum validasyonu - basit kontrol
        if (!value || typeof value !== 'string') {
          throw new Error('Durum belirtilmelidir.');
        }
        // Not: Async validasyon Sequelize'de sorunlu olabilir, temel kontrolü yap
        if (value.trim().length === 0) {
          throw new Error('Durum boş olamaz.');
        }
      }
    }
  },
  tezgah_id: DataTypes.INTEGER,
  uretim_plani_id: DataTypes.INTEGER,
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'parcalar',
      key: 'parca_kodu'
    }
  },
  aciklama: DataTypes.TEXT,
  hareketler: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  setup_sayisi: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  cnc_suresi: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  malzemesi_siparis_edilecekmi: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  malzeme_siparis_tarihi: {
    type: DataTypes.DATE,
    allowNull: true
  },
  siparis_dokumani_dosya_yolu: {
    type: DataTypes.STRING,
    allowNull: true
  },
  malzemenin_geldigi_tarih: {
    type: DataTypes.DATE,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  is_zaman_uzunlugu: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 1.0,
    comment: 'İş emrinin tahmini süresi (saat cinsinden)'
  },
  tahmini_isleme_suresi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    },
    comment: 'İş emrinin tahmini işleme süresi (vardiya cinsinden)'
  }
}, {
  sequelize,
  modelName: 'IsEmri',
  tableName: 'is_emirleri',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi'
});

module.exports = IsEmri;