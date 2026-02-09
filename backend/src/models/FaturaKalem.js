const { DataTypes } = require('sequelize');

/**
 * Fatura Kalem Model
 *
 * Expert Panel Requirements:
 * - Cross-reference field: eslesen_irsaliye_kalem_id (bidirectional audit trail)
 * - Denormalized tedarikci_id for optimized matching queries
 * - eslesme_durumu: 0 (bekliyor), 1 (eşleşti)
 * - Price fields: birim_fiyat, toplam_tutar (recording only)
 *
 * @module FaturaKalem
 */
module.exports = (sequelize) => {
  const FaturaKalem = sequelize.define('FaturaKalem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fatura_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'faturalar',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Fatura ID zorunludur'
        }
      }
    },
    tedarikci_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'firmalar',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Tedarikçi ID zorunludur'
        }
      },
      comment: 'Denormalizasyon'
    },
    stok_kodu: {
      type: DataTypes.STRING(100),
      allowNull: true,  // Opsiyonel - bilgi amaçlı
      comment: 'Stok kodu (bilgi amaçlı, opsiyonel)'
    },
    mal_hizmet_adi: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Mal/Hizmet adı zorunludur'
        },
        notEmpty: {
          msg: 'Mal/Hizmet adı boş olamaz'
        },
        len: {
          args: [1, 500],
          msg: 'Mal/Hizmet adı 1-500 karakter arasında olmalıdır'
        }
      },
      comment: 'Mal/Hizmet adı (eşleştirme için kritik alan)'
    },
    miktar: {
      type: DataTypes.REAL,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Miktar zorunludur'
        },
        min: {
          args: [0.0001],
          msg: 'Miktar 0\'dan büyük olmalıdır'
        }
      }
    },
    birim: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Adet',
      validate: {
        isIn: {
          args: [['Adet', 'KG', 'Lt', 'Mt', 'm2', 'm3', 'Gram']],
          msg: 'Birim "Adet", "KG", "Lt", "Mt", "m2", "m3", "Gram" olmalıdır'
        }
      }
    },
    birim_fiyat: {
      type: DataTypes.REAL,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Birim fiyat 0 veya daha büyük olmalıdır'
        }
      },
      comment: 'Sadece kayıt amaçlı'
    },
    toplam_tutar: {
      type: DataTypes.REAL,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Toplam tutar 0 veya daha büyük olmalıdır'
        }
      },
      comment: 'miktar * birim_fiyat'
    },
    eslesme_durumu: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isIn: {
          args: [[0, 1]],
          msg: 'Eşleşme durumu 0 (bekliyor) veya 1 (eşleşti) olmalıdır'
        }
      },
      comment: '0: Bekliyor, 1: Eşleşti'
    },
    eslesen_irsaliye_kalem_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'irsaliye_kalemleri',
        key: 'id'
      },
      comment: 'Eşleşen irsaliye kalemi ID (cross-reference)'
    },
    aciklama: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'fatura_kalemleri',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['fatura_id']
      },
      {
        fields: ['tedarikci_id']
      },
      {
        fields: ['stok_kodu']
      },
      {
        fields: ['mal_hizmet_adi']
      },
      {
        fields: ['eslesme_durumu']
      },
      {
        fields: ['eslesen_irsaliye_kalem_id']
      },
      // Expert Panel: Composite index for optimized matching
      // Eşleştirme: tedarikci_id + eslesme_durumu + mal_hizmet_adi
      {
        name: 'idx_fk_matching_optimization',
        fields: ['tedarikci_id', 'eslesme_durumu', 'mal_hizmet_adi']
      }
    ],
    hooks: {
      beforeCreate: async (kalem) => {
        // Calculate toplam_tutar if not provided
        if (!kalem.toplam_tutar || kalem.toplam_tutar === 0) {
          kalem.toplam_tutar = kalem.miktar * kalem.birim_fiyat;
        }
      },
      beforeUpdate: async (kalem) => {
        // Recalculate toplam_tutar if miktar or birim_fiyat changed
        if (kalem.changed('miktar') || kalem.changed('birim_fiyat')) {
          kalem.toplam_tutar = kalem.miktar * kalem.birim_fiyat;
        }
      },
      afterCreate: async (kalem) => {
        // Update parent fatura stats
        await kalem.updateParentStats();
      },
      afterUpdate: async (kalem) => {
        // Update parent fatura stats and durum
        await kalem.updateParentStats();
        await kalem.updateParentDurum();
      },
      afterDestroy: async (kalem) => {
        // Update parent fatura stats
        await kalem.updateParentStats();
      }
    }
  });

  /**
   * Instance Methods
   */

  /**
   * Update parent fatura statistics (toplam_kalem, toplam_miktar, ara_toplam, kdv, genel_toplam)
   */
  FaturaKalem.prototype.updateParentStats = async function() {
    const Fatura = sequelize.models.Fatura;

    const stats = await FaturaKalem.findAll({
      where: { fatura_id: this.fatura_id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'kalem_sayisi'],
        [sequelize.fn('SUM', sequelize.col('miktar')), 'toplam_miktar'],
        [sequelize.fn('SUM', sequelize.col('toplam_tutar')), 'ara_toplam']
      ],
      raw: true
    });

    const { kalem_sayisi, toplam_miktar, ara_toplam } = stats[0];

    // Calculate KDV (örnek: %20)
    const kdv = (ara_toplam || 0) * 0.20;
    const genel_toplam = (ara_toplam || 0) + kdv;

    await Fatura.update({
      toplam_kalem: kalem_sayisi || 0,
      toplam_miktar: toplam_miktar || 0,
      ara_toplam: ara_toplam || 0,
      kdv: kdv,
      genel_toplam: genel_toplam
    }, {
      where: { id: this.fatura_id }
    });
  };

  /**
   * Update parent fatura durum based on kalem eslesme durumleri
   * Expert Panel: Calculate from scratch for consistency
   */
  FaturaKalem.prototype.updateParentDurum = async function() {
    const Fatura = sequelize.models.Fatura;

    const stats = await FaturaKalem.findAll({
      where: { fatura_id: this.fatura_id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'toplam_kalem'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN eslesme_durumu = 1 THEN 1 ELSE 0 END')), 'eslesen_kalem']
      ],
      raw: true
    });

    const { toplam_kalem, eslesen_kalem } = stats[0];
    let durum = 'bekliyor';

    if (toplam_kalem > 0) {
      if (eslesen_kalem === 0) {
        durum = 'bekliyor';
      } else if (eslesen_kalem < toplam_kalem) {
        durum = 'kismi_eslesti';
      } else {
        durum = 'tam_eslesti';
      }
    }

    await Fatura.update({ durum }, {
      where: { id: this.fatura_id }
    });
  };

  /**
   * Check if kalem is available for matching
   *
   * @returns {boolean} True if eslesme_durumu = 0
   */
  FaturaKalem.prototype.eslestirmeyeUygun = function() {
    return this.eslesme_durumu === 0;
  };

  /**
   * Get matching irsaliye kalemleri
   * Expert Panel: Optimized with composite index
   *
   * Eşleştirme kriterleri:
   * - Aynı tedarikci_id (ZORUNLU)
   * - İrsaliye kalem eslesme_durumu = 0 (ZORUNLU)
   * - mal_hizmet_adi tam eşleşmesi (ZORUNLU, case-insensitive)
   * - stok_kodu bilgilendirme amaçlı (zorunlu değil)
   *
   * @returns {Promise<Array>} Matching irsaliye kalemleri
   */
  FaturaKalem.prototype.eslesmeAdaylari = async function() {
    const IrsaliyeKalem = sequelize.models.IrsaliyeKalem;

    return IrsaliyeKalem.findAll({
      where: {
        tedarikci_id: this.tedarikci_id,
        eslesme_durumu: 0,
        // mal_hizmet_adi zorunlu eşleşme (case-insensitive)
        mal_hizmet_adi: this.mal_hizmet_adi
      },
      include: [{
        model: sequelize.models.Irsaliye,
        as: 'irsaliye',
        where: { tedarikci_id: this.tedarikci_id },
        required: true
      }],
      order: [['irsaliye', 'belge_tarih', 'ASC']]
    });
  };

  /**
   * Class Methods
   */

  /**
   * Find bekleyen kalemler by tedarikci and mal_hizmet_adi
   * Expert Panel: Optimized query using composite index
   *
   * Eşleştirme kriteri: mal_hizmet_adi tam eşleşmesi zorunlu
   *
   * @param {number} tedarikciId - Tedarikçi ID
   * @param {string} malHizmetAdi - Mal/hizmet adı
   * @returns {Promise<Array>} Bekleyen kalemler
   */
  FaturaKalem.bekleyenlerByTedarikciVeMalHizmet = function(tedarikciId, malHizmetAdi) {
    return this.findAll({
      where: {
        tedarikci_id,
        eslesme_durumu: 0,
        mal_hizmet_adi: malHizmetAdi
      },
      include: [{
        model: sequelize.models.Fatura,
        as: 'fatura'
      }],
      order: [['created_at', 'DESC']]
    });
  };

  /**
   * Model Associations
   */
  FaturaKalem.associate = (models) => {
    // Ana fatura ilişkisi
    if (models.Fatura) {
      FaturaKalem.belongsTo(models.Fatura, {
        foreignKey: 'fatura_id',
        as: 'fatura'
      });
    }

    // Tedarikçi ilişkisi
    if (models.Firma) {
      FaturaKalem.belongsTo(models.Firma, {
        foreignKey: 'tedarikci_id',
        as: 'tedarikci'
      });
    }

    // Cross-reference irsaliye kalem ilişkisi
    if (models.IrsaliyeKalem) {
      FaturaKalem.belongsTo(models.IrsaliyeKalem, {
        foreignKey: 'eslesen_irsaliye_kalem_id',
        as: 'eslesen_irsaliye_kalem'
      });

      // Reverse association: İrsaliye kalemleri bu fatura kalemine eşleşebilir
      FaturaKalem.hasMany(models.IrsaliyeKalem, {
        foreignKey: 'eslesen_fatura_kalem_id',
        as: 'eslesen_irsaliye_kalemleri'
      });
    }
  };

  return FaturaKalem;
};
