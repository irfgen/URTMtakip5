const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class StokKarti extends Model {
  static associate(models) {
    // StokKarti has many Parca (ham malzeme olarak kullanılan)
    StokKarti.hasMany(models.Parca, {
      foreignKey: 'stok_karti_id',
      as: 'parcalar'
    });
  }

  // Instance metodları
  
  /**
   * Kritik stok kontrolü yapar
   * @returns {boolean} Kritik stok durumu
   */
  isKritikStok() {
    return this.adet <= this.kritik_stok_miktari;
  }

  /**
   * Stok durumu hesaplar
   * @returns {object} Stok durumu bilgileri
   */
  getStokDurumu() {
    const kritik = this.isKritikStok();
    const yuzde = this.kritik_stok_miktari > 0 ? 
      Math.round((this.adet / this.kritik_stok_miktari) * 100) : 100;

    let durum = 'normal';
    if (this.adet === 0) {
      durum = 'stokta_yok';
    } else if (kritik) {
      durum = 'kritik';
    } else if (yuzde > 200) {
      durum = 'yuksek';
    }

    return {
      durum,
      kritik,
      yuzde,
      kalan_adet: this.adet,
      kritik_seviye: this.kritik_stok_miktari
    };
  }

  /**
   * Formatlanmış boyut bilgisi döner
   * @returns {string} Formatlanmış boyut
   */
  getFormattedBoyut() {
    let boyut = this.kesit;
    if (this.boy) {
      boyut += ` x ${this.boy}mm`;
    }
    return boyut;
  }

  // Class metodları
  
  /**
   * Kritik stok seviyesindeki kartları bulur
   * @returns {Promise<StokKarti[]>} Kritik stok listesi
   */
  static async findKritikStoklar() {
    return await this.findAll({
      where: sequelize.literal('adet <= kritik_stok_miktari'),
      order: [['adet', 'ASC']]
    });
  }

  /**
   * Malzeme cinsine göre arama yapar
   * @param {string} malzeme Malzeme cinsi
   * @returns {Promise<StokKarti[]>} Arama sonuçları
   */
  static async searchByMalzeme(malzeme) {
    const { Op } = require('sequelize');
    return await this.findAll({
      where: {
        malzeme_cinsi: {
          [Op.like]: `%${malzeme}%`
        },
        aktif_mi: true
      },
      order: [['malzeme_cinsi', 'ASC']]
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
      malzeme_cinsi,
      firma,
      kritik_stok,
      sayfa = 1,
      limit = 20,
      sort_by = 'malzeme_cinsi',
      sort_order = 'ASC',
      only_ids
    } = options;

    const { Op } = require('sequelize');
    const where = { aktif_mi: true };
    
    // Genel arama
    if (q) {
      where[Op.or] = [
        { malzeme_cinsi: { [Op.like]: `%${q}%` } },
        { firma: { [Op.like]: `%${q}%` } },
        { kesit: { [Op.like]: `%${q}%` } },
        { malzeme_adi: { [Op.like]: `%${q}%` } },
        { lokasyon: { [Op.like]: `%${q}%` } }
      ];
    }

    // Spesifik filtreler
    if (malzeme_cinsi) {
      where.malzeme_cinsi = { [Op.like]: `%${malzeme_cinsi}%` };
    }

    if (firma) {
      where.firma = { [Op.like]: `%${firma}%` };
    }

    // Kritik stok filtresi
    if (kritik_stok === 'true') {
      where[Op.and] = sequelize.literal('adet <= kritik_stok_miktari');
    }

    // Sadece belirli id'ler
    if (Array.isArray(only_ids) && only_ids.length > 0) {
      where.id = { ...(where.id || {}), [Op.in]: only_ids.map(Number).filter(Number.isInteger) };
    }

    const offset = (sayfa - 1) * limit;

    const { count, rows } = await this.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort_by, sort_order.toUpperCase()]],
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
   * Firma listesini getirir
   * @returns {Promise<string[]>} Benzersiz firma listesi
   */
  static async getFirmaList() {
    const firmalar = await this.findAll({
      attributes: ['firma'],
      where: {
        firma: { [require('sequelize').Op.ne]: null },
        aktif_mi: true
      },
      group: ['firma'],
      order: [['firma', 'ASC']]
    });

    return firmalar.map(f => f.firma).filter(Boolean);
  }

  /**
   * Malzeme cinsi listesini getirir
   * @returns {Promise<string[]>} Benzersiz malzeme cinsi listesi
   */
  static async getMalzemeCinsiList() {
    const malzemeler = await this.findAll({
      attributes: ['malzeme_cinsi'],
      where: { aktif_mi: true },
      group: ['malzeme_cinsi'],
      order: [['malzeme_cinsi', 'ASC']]
    });

    return malzemeler.map(m => m.malzeme_cinsi);
  }
}

// Model tanımı
StokKarti.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  kesit: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Kesit bilgisi boş olamaz'
      },
      len: {
        args: [1, 50],
        msg: 'Kesit 1-50 karakter arasında olmalı'
      }
    },
    comment: 'Malzeme kesiti'
  },
  boy: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Boy 0\'dan küçük olamaz'
      }
    },
    comment: 'Boy mm cinsinden'
  },
  malzeme_adi: {
    type: DataTypes.STRING(200),
    allowNull: true,
    validate: {
      len: {
        args: [0, 200],
        msg: 'Malzeme adı maksimum 200 karakter olabilir'
      }
    },
    comment: 'Malzeme adı/açıklaması'
  },
  malzeme_cinsi: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Malzeme cinsi boş olamaz'
      },
      len: {
        args: [1, 100],
        msg: 'Malzeme cinsi 1-100 karakter arasında olmalı'
      }
    },
    comment: 'Malzeme tipi'
  },
  adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Adet 0\'dan küçük olamaz'
      },
      isInt: {
        msg: 'Adet tam sayı olmalı'
      }
    },
    comment: 'Mevcut stok miktarı'
  },
  kritik_stok_miktari: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Kritik stok miktarı 0\'dan küçük olamaz'
      },
      isInt: {
        msg: 'Kritik stok miktarı tam sayı olmalı'
      }
    },
    comment: 'Minimum stok seviyesi'
  },
  lokasyon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: {
        args: [0, 50],
        msg: 'Lokasyon maksimum 50 karakter olabilir'
      }
    },
    comment: 'Depo konumu'
  },
  adres: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detaylı adres bilgisi'
  },
  firma: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'Firma adı maksimum 100 karakter olabilir'
      }
    },
    comment: 'Tedarikçi firma adı'
  },
  aktif_mi: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Kayıt durumu'
  },
  olusturma_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Kayıt oluşturma tarihi'
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Son güncelleme tarihi'
  }
}, {
  sequelize,
  modelName: 'StokKarti',
  tableName: 'stok_kartlari',
  timestamps: true,
  createdAt: 'olusturma_tarihi',
  updatedAt: 'guncelleme_tarihi',
  hooks: {
    beforeSave: (stokKarti) => {
      // Güncelleme tarihini otomatik ayarla
      stokKarti.guncelleme_tarihi = new Date();
    }
  }
});

module.exports = StokKarti;
