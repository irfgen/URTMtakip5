const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class TedarikTalebi extends Model {
  static associate(models) {
    // TedarikTalebi belongs to StokKarti
    TedarikTalebi.belongsTo(models.StokKarti, {
      foreignKey: 'stok_karti_id',
      as: 'stokKarti',
      constraints: false // Foreign key constraint'ini devre dışı bırak
    });

    // TedarikTalepi belongs to IsEmri
    TedarikTalebi.belongsTo(models.IsEmri, {
      foreignKey: 'is_emri_id',
      as: 'isEmri',
      constraints: false // Foreign key constraint'ini devre dışı bırak
    });

    // TedarikTalepi belongs to Firma
    TedarikTalebi.belongsTo(models.Firma, {
      foreignKey: 'firma_id',
      as: 'firma',
      constraints: false
    });

    // TedarikTalebi has many TedarikDetaylari
    TedarikTalebi.hasMany(models.TedarikDetay, {
      foreignKey: 'talep_id',
      as: 'detaylar'
    });
  }

  // Instance metodları

  /**
   * Talep kodu oluşturur
   * @returns {string} Formatlanmış talep kodu
   */
  generateTalepKodu() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `TAL-${year}${month}${day}-${String(this.id).padStart(3, '0')}`;
  }

  /**
   * Talep durumunu kontrol eder
   * @param {string} yeniDurum Yeni durum
   * @returns {boolean} Durum değiştirilebilir mi
   */
  canChangeStatusTo(yeniDurum) {
    const durumAkisi = {
      'beklemede': ['onaylandi', 'reddedildi'],
      'onaylandi': ['sipariste', 'reddedildi'],
      'sipariste': ['teslim_edildi'],
      'reddedildi': ['beklemede'],
      'teslim_edildi': [] // Teslim edilen talep durumu değiştirilemez
    };

    return durumAkisi[this.durum]?.includes(yeniDurum) || false;
  }

  /**
   * Talep durumu geçmişini kontrol eder
   * @returns {boolean} Talep aktif mi
   */
  isAktif() {
    return !['teslim_edildi', 'reddedildi'].includes(this.durum);
  }

  /**
   * Formatlanmış toplam tutar
   * @returns {string} Formatlanmış tutar
   */
  getFormattedToplamTutar() {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(this.toplam_tutar || 0);
  }

  // Class metodları

  /**
   * Duruma göre talepleri bulur
   * @param {string} durum Talep durumu
   * @param {object} options Ek seçenekler
   * @returns {Promise<TedarikTalebi[]>} Talep listesi
   */
  static async findByDurum(durum, options = {}) {
    const { limit = 20, offset = 0 } = options;

    return await this.findAll({
      where: { durum },
      include: [
        {
          model: require('./TedarikDetay'),
          as: 'detaylar'
        }
      ],
      order: [['talep_tarihi', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Kaynağa göre talepleri bulur
   * @param {string} kaynakTipi Kaynak tipi
   * @param {number} kaynakId Kaynak ID
   * @returns {Promise<TedarikTalebi[]>} Talep listesi
   */
  static async findByKaynak(kaynakTipi, kaynakId) {
    return await this.findAll({
      where: {
        kaynak_tipi: kaynakTipi,
        kaynak_id: kaynakId
      },
      include: [
        {
          model: require('./TedarikDetay'),
          as: 'detaylar'
        }
      ],
      order: [['talep_tarihi', 'DESC']]
    });
  }

  /**
   * Gelişmiş arama fonksiyonu
   * @param {object} options Arama parametreleri
   * @returns {Promise<object>} Sayfalanmış sonuçlar
   */
  static async searchWithPagination(options = {}) {
    const {
      q,
      durum,
      kaynak_tipi,
      tarih_baslangic,
      tarih_bitis,
      sayfa = 1,
      limit = 20
    } = options;

    const { Op } = require('sequelize');
    const where = {};

    // Genel arama
    if (q) {
      where[Op.or] = [
        { talep_kodu: { [Op.like]: `%${q}%` } },
        { parca_kodu: { [Op.like]: `%${q}%` } },
        { aciklama: { [Op.like]: `%${q}%` } }
      ];
    }

    // Durum filtresi
    if (durum) {
      where.durum = durum;
    }

    // Kaynak tipi filtresi
    if (kaynak_tipi) {
      where.kaynak_tipi = kaynak_tipi;
    }

    // Tarih aralığı filtresi
    if (tarih_baslangic || tarih_bitis) {
      where.talep_tarihi = {};
      if (tarih_baslangic) {
        where.talep_tarihi[Op.gte] = new Date(tarih_baslangic);
      }
      if (tarih_bitis) {
        where.talep_tarihi[Op.lte] = new Date(tarih_bitis);
      }
    }

    const offset = (sayfa - 1) * limit;

    const { count, rows } = await this.findAndCountAll({
      where,
      include: [
        {
          model: require('./TedarikDetay'),
          as: 'detaylar'
        },
        // Firma ilişkisi - geçici olarak kaldırıldı
        // TODO: Model'ler arası uyumsuzluk düzeltildikten sonra eklenecek
      ],
      limit: parseInt(limit),
      offset,
      order: [['talep_tarihi', 'DESC']],
      distinct: true
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(sayfa),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * İstatistikleri getirir
   * @param {string} baslangicTarihi Başlangıç tarihi
   * @param {string} bitisTarihi Bitiş tarihi
   * @returns {Promise<object>} İstatistik verileri
   */
  static async getIstatistikler(baslangicTarihi, bitisTarihi) {
    const whereClause = {};
    if (baslangicTarihi || bitisTarihi) {
      whereClause.talep_tarihi = {};
      if (baslangicTarihi) {
        whereClause.talep_tarihi[Op.gte] = new Date(baslangicTarihi);
      }
      if (bitisTarihi) {
        whereClause.talep_tarihi[Op.lte] = new Date(bitisTarihi);
      }
    }

    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        'durum',
        [sequelize.fn('COUNT', sequelize.col('id')), 'adet'],
        [sequelize.fn('SUM', sequelize.col('toplam_tutar')), 'toplam_tutar']
      ],
      group: ['durum'],
      raw: true
    });

    const result = {
      beklemede: { adet: 0, tutar: 0 },
      onaylandi: { adet: 0, tutar: 0 },
      sipariste: { adet: 0, tutar: 0 },
      teslim_edildi: { adet: 0, tutar: 0 },
      reddedildi: { adet: 0, tutar: 0 }
    };

    stats.forEach(stat => {
      if (result[stat.durum]) {
        result[stat.durum].adet = parseInt(stat.adet);
        result[stat.durum].tutar = parseFloat(stat.toplam_tutar) || 0;
      }
    });

    return result;
  }
}

// Model tanımı
TedarikTalebi.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  talep_kodu: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: 'Otomatik üretilen talep kodu'
  },
  kaynak_tipi: {
    type: DataTypes.ENUM('is_emri', 'parca', 'stok_karti', 'manuel'),
    allowNull: false,
    defaultValue: 'manuel',
    comment: 'Talep kaynağı'
  },
  kaynak_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Kaynak ID (is_emri, parca, stok_karti)'
  },
  is_emri_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'İş emri ID (eğer iş emrinden oluşturulduysa)'
  },
  parca_kodu: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Parça kodu'
  },
  stok_karti_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Stok kartı ID'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Talep açıklaması'
  },
  talep_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Talep oluşturma tarihi'
  },
  onay_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Onay tarihi'
  },
  tedarik_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tedarik tarihi'
  },
  durum: {
    type: DataTypes.ENUM('beklemede', 'onaylandi', 'reddedildi', 'sipariste', 'teslim_edildi'),
    allowNull: false,
    defaultValue: 'beklemede',
    comment: 'Talep durumu'
  },
  talep_eden_kullanici: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Talep oluşturan kullanıcı'
  },
  onaylayan_kullanici: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Talebi onaylayan kullanıcı'
  },
  miktar: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Talep miktarı (detay tablosu kullanıldığında)'
  },
  birim: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Birim (kg, adet, metrekare vb)'
  },
  birim_fiyat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Birim fiyat'
  },
  toplam_tutar: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Toplam talep tutarı'
  },
  siparis_dokumani: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Sipariş dokümanı dosya yolu'
  },
  irsaliye_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'İrsaliye numarası'
  },
  irsaliye_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'İrsaliye tarihi'
  },
  teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Teslimat tarihi'
  },
  firma_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Sipariş verilen firma ID'
  },
  siparis_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Sipariş verildiği tarih'
  },
  otomatik_sevkiyat: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Otomatik sevkiyat oluşturulsun mu'
  },
  son_islem_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Son işlem tarihi'
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ek notlar'
  }
}, {
  sequelize,
  modelName: 'TedarikTalebi',
  tableName: 'tedarik_talepleri',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: (talep) => {
      // Talep kodunu otomatik oluştur
      if (!talep.talep_kodu) {
        talep.talep_kodu = talep.generateTalepKodu();
      }
    },
    beforeSave: (talep) => {
      // Durum değişikliğinde tarihleri güncelle
      if (talep.changed('durum')) {
        if (talep.durum === 'onaylandi' && !talep.onay_tarihi) {
          talep.onay_tarihi = new Date();
        }
        if (talep.durum === 'teslim_edildi' && !talep.teslim_tarihi) {
          talep.teslim_tarihi = new Date();
        }
      }
    }
  }
});

module.exports = TedarikTalebi;