const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class Parca extends Model {
  static associate(models) {
    // Parca has many ParcaKayitlari
    Parca.hasMany(models.ParcaKayitlari, {
      foreignKey: 'parca_kodu',
      sourceKey: 'parcaKodu',
      as: 'kayitlar'
    });

    // Parca belongs to StokKarti (ham malzeme için)
    Parca.belongsTo(models.StokKarti, {
      foreignKey: 'stok_karti_id',
      as: 'stokKarti',
      allowNull: true
    });
  }

  /**
   * Geriye uyumluluk için ham malzeme ölçülerini döndürür
   * @returns {string|null} Ham malzeme ölçüleri (kesit x boy formatında)
   */
  get hamMalzemeOlculeriFormatted() {
    if (this.stokKarti) {
      let olcu = this.stokKarti.kesit;
      if (this.stokKarti.boy) {
        olcu += ` x ${this.stokKarti.boy}mm`;
      }
      return olcu;
    }
    // Fallback: eski hamMalzemeOlculeri alanı
    return this.hamMalzemeOlculeri || null;
  }

  /**
   * Ham malzeme cinsi bilgisini döndürür (stok kartından veya parçadan)
   * @returns {string|null}
   */
  get hamMalzemeCinsiFormatted() {
    if (this.stokKarti) {
      return this.stokKarti.malzeme_cinsi;
    }
    return this.hamMalzemeCinsi || null;
  }

  /**
   * Stok kartı bilgisini içeren tam açıklama
   * @returns {string}
   */
  get hamMalzemeTamAciklama() {
    if (this.stokKarti) {
      const olcu = this.hamMalzemeOlculeriFormatted;
      const cinsi = this.hamMalzemeCinsiFormatted;
      return `${cinsi} - ${olcu}${this.stokKarti.adet > 0 ? ` (Stok: ${this.stokKarti.adet} adet)` : ''}`;
    }
    return this.hamMalzemeOlculeri || 'Ham malzeme belirtilmemiş';
  }
}

Parca.init({
  parcaKodu: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
    field: 'parca_kodu',
    validate: { notEmpty: true }
  },
  parcaAdi: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'parca_adi',
    comment: 'Parça adı'
  },
  parcaKayitIdleri: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'parca_kayit_idleri',
    comment: 'Parça kayıt ID\'leri (JSON array)'
  },
  kategori: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'kategori',
    comment: 'Parça kategorisi'
  },
  stokAdeti: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'stok_adeti',
    validate: { min: 0 }
  },
  kritik_stok: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: { min: 0 }
  },
  teknik_resim_path: {
    type: DataTypes.STRING,
    field: 'teknik_resim_path'
  },
  foto_path: {
    type: DataTypes.STRING,
    field: 'foto_path'
  },
  tedarikBedeli: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
    hamMalzemeCinsi: DataTypes.STRING,
  hamMalzemeOlculeri: DataTypes.STRING,
  stok_karti_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'stok_kartlari',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Ham malzeme stok kartı referansı'
  },
  imalMi: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'imal_mi',
    comment: 'İmalat mı?'
  },
  imalat_prosedur_no: DataTypes.STRING,
  fasonMaliyeti: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: { min: 0 }
  },
  sirketIciMaliyeti: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: { min: 0 }
  },
  setupSayisi: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'setup_sayisi',
    comment: 'Setup sayısı'
  },
  cncIslemeSuresi: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'cnc_isleme_suresi',
    comment: 'CNC işleme süresi (dk)'
  },
  siyah: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Siyah mı?'
  },
  sldprt_yolu: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'sldprt_yolu',
    comment: 'SLDPRT dosyasının sunucudaki yolu'
  },
  slddrw_yolu: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'slddrw_yolu',
    comment: 'SLDDRW dosyasının sunucudaki yolu'
  }
}, {
  sequelize,
  modelName: 'Parca',
  tableName: 'parcalar',
  timestamps: true
});

module.exports = Parca;