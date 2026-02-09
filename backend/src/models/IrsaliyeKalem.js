const { DataTypes } = require('sequelize');

/**
 * İrsaliye Kalem Model
 *
 * Expert Panel Requirements:
 * - Cross-reference field: eslesen_fatura_kalem_id (bidirectional audit trail)
 * - Denormalized tedarikci_id for optimized matching queries
 * - eslesme_durumu: 0 (bekliyor), 1 (eşleşti)
 *
 * @module IrsaliyeKalem
 */
module.exports = (sequelize) => {
  const IrsaliyeKalem = sequelize.define('IrsaliyeKalem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    irsaliye_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'irsaliyeler',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'İrsaliye ID zorunludur'
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
      comment: 'Denormalizasyon - hızlı eşleştirme için'
    },
    stok_kodu: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Stok kodu maximum 100 karakter olabilir'
        }
      },
      comment: 'İrsaliyeden okunan stok kodu (opsiyonel)'
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
    eslesen_fatura_kalem_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fatura_kalemleri',
        key: 'id'
      },
      comment: 'Eşleşen fatura kalemi ID (cross-reference)'
    },
    aciklama: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'irsaliye_kalemleri',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['irsaliye_id']
      },
      {
        fields: ['tedarikci_id']
      },
      {
        fields: ['stok_kodu']
      },
      {
        fields: ['eslesme_durumu']
      },
      {
        fields: ['eslesen_fatura_kalem_id']
      },
      // Expert Panel: Composite index for optimized matching
      {
        name: 'idx_irk_matching_optimization',
        fields: ['tedarikci_id', 'eslesme_durumu', 'stok_kodu']
      }
    ],
    hooks: {
      afterCreate: async (kalem) => {
        // Update parent irsaliye stats
        await kalem.updateParentStats();
      },
      afterUpdate: async (kalem) => {
        // Update parent irsaliye stats and durum
        await kalem.updateParentStats();
        await kalem.updateParentDurum();
      },
      afterDestroy: async (kalem) => {
        // Update parent irsaliye stats
        await kalem.updateParentStats();
      }
    }
  });

  /**
   * Instance Methods
   */

  /**
   * Update parent irsaliye statistics (toplam_kalem, toplam_miktar)
   */
  IrsaliyeKalem.prototype.updateParentStats = async function() {
    const Irsaliye = sequelize.models.Irsaliye;

    const stats = await IrsaliyeKalem.findAll({
      where: { irsaliye_id: this.irsaliye_id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'kalem_sayisi'],
        [sequelize.fn('SUM', sequelize.col('miktar')), 'toplam_miktar']
      ],
      raw: true
    });

    await Irsaliye.update({
      toplam_kalem: stats[0].kalem_sayisi || 0,
      toplam_miktar: stats[0].toplam_miktar || 0
    }, {
      where: { id: this.irsaliye_id }
    });
  };

  /**
   * Update parent irsaliye durum based on kalem eslesme durumleri
   * Expert Panel: Calculate from scratch for consistency
   */
  IrsaliyeKalem.prototype.updateParentDurum = async function() {
    const Irsaliye = sequelize.models.Irsaliye;

    const stats = await IrsaliyeKalem.findAll({
      where: { irsaliye_id: this.irsaliye_id },
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

    await Irsaliye.update({ durum }, {
      where: { id: this.irsaliye_id }
    });
  };

  /**
   * Check if kalem is available for matching
   *
   * @returns {boolean} True if eslesme_durumu = 0
   */
  IrsaliyeKalem.prototype.eslestirmeyeUygun = function() {
    return this.eslesme_durumu === 0;
  };

  /**
   * Get matching fatura kalemleri
   * Expert Panel: Optimized with composite index
   *
   * @returns {Promise<Array>} Matching fatura kalemleri
   */
  IrsaliyeKalem.prototype.eslesmeAdaylari = async function() {
    const FaturaKalem = sequelize.models.FaturaKalem;
    const { Op } = require('sequelize');

    return FaturaKalem.findAll({
      where: {
        tedarikci_id: this.tedarikci_id,
        eslesme_durumu: 0,
        [Op.or]: [
          { stok_kodu: this.stok_kodu },
          { mal_hizmet_adi: this.mal_hizmet_adi }
        ]
      },
      include: [{
        model: sequelize.models.Fatura,
        as: 'fatura',
        where: { tedarikci_id: this.tedarikci_id },
        required: true
      }],
      order: [['fatura', 'belge_tarih', 'ASC']]
    });
  };

  /**
   * Class Methods
   */

  /**
   * Find bekleyen kalemler by tedarikci and stok_kodu (veya mal_hizmet_adi)
   * Expert Panel: Optimized query using composite index
   *
   * @param {number} tedarikciId - Tedarikçi ID
   * @param {string} stokKodu - Stok kodu veya mal_hizmet_adi
   * @returns {Promise<Array>} Bekleyen kalemler
   */
  IrsaliyeKalem.bekleyenlerByTedarikciVeStok = function(tedarikciId, stokKodu) {
    const { Op } = require('sequelize');

    return this.findAll({
      where: {
        tedarikci_id,
        eslesme_durumu: 0,
        [Op.or]: [
          { stok_kodu: stokKodu },
          { mal_hizmet_adi: stokKodu }
        ]
      },
      include: [{
        model: sequelize.models.Irsaliye,
        as: 'irsaliye'
      }],
      order: [['created_at', 'DESC']]
    });
  };

  /**
   * Model Associations
   */
  IrsaliyeKalem.associate = (models) => {
    // Ana irsaliye ilişkisi
    if (models.Irsaliye) {
      IrsaliyeKalem.belongsTo(models.Irsaliye, {
        foreignKey: 'irsaliye_id',
        as: 'irsaliye'
      });
    }

    // Tedarikçi ilişkisi
    if (models.Firma) {
      IrsaliyeKalem.belongsTo(models.Firma, {
        foreignKey: 'tedarikci_id',
        as: 'tedarikci'
      });
    }

    // Cross-reference fatura kalem ilişkisi
    if (models.FaturaKalem) {
      IrsaliyeKalem.belongsTo(models.FaturaKalem, {
        foreignKey: 'eslesen_fatura_kalem_id',
        as: 'eslesen_fatura_kalemi'
      });

      // Reverse association: Fatura kalemleri bu irsaliye kalemine eşleşebilir
      IrsaliyeKalem.hasMany(models.FaturaKalem, {
        foreignKey: 'eslesen_irsaliye_kalem_id',
        as: 'eslesen_fatura_kalemleri'
      });
    }
  };

  return IrsaliyeKalem;
};
