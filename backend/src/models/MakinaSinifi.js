const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class MakinaSinifi extends Model {
  static associate(models) {
    // Bir makina sınıfı birden çok makina içerebilir
    MakinaSinifi.hasMany(models.Makina, {
      foreignKey: 'makina_sinifi_id',
      sourceKey: 'id',
      as: 'makinalar'
    });
  }

  /**
   * Aktif makina sınıflarını döndürür
   * @param {Object} options - Sequelize include options
   * @returns {Promise<Array>} Aktif makina sınıfları listesi
   */
  static async getActiveSiniflar(options = {}) {
    return MakinaSinifi.findAll({
      where: { aktif: true },
      order: [['ad', 'ASC']],
      ...options
    });
  }

  /**
   * Makina sınıfı ve bağlı makinaların sayısını döndürür
   * @returns {Promise<Array>} Makina sınıfları ve makina sayıları
   */
  static async getSiniflarWithMakinaCount() {
    const query = `
      SELECT
        ms.id,
        ms.ad,
        ms.aciklama,
        ms.aktif,
        ms.created_at,
        ms.updated_at,
        COUNT(m.makina_id) as makina_sayisi
      FROM makina_siniflari ms
      LEFT JOIN makinalar m ON ms.id = m.makina_sinifi_id
      WHERE ms.aktif = true
      GROUP BY ms.id, ms.ad, ms.aciklama, ms.aktif, ms.created_at, ms.updated_at
      ORDER BY ms.ad ASC
    `;

    return sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });
  }

  /**
   * Sınıf adının benzersiz olup olmadığını kontrol eder
   * @param {string} ad - Sınıf adı
   * @param {number} excludeId - Hariç tutulacak ID (güncelleme için)
   * @returns {Promise<boolean>} Ad benzersiz mi?
   */
  static async isUniqueAd(ad, excludeId = null) {
    const whereClause = { ad: ad.trim() };
    if (excludeId) {
      whereClause.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }

    const existing = await MakinaSinifi.findOne({ where: whereClause });
    return !existing;
  }

  /**
   * Sınıf adını formatlar ve doğrular
   * @param {string} ad - Formatlanacak sınıf adı
   * @returns {string} Formatlanmış sınıf adı
   */
  static formatAd(ad) {
    if (!ad) return '';
    return ad.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

MakinaSinifi.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  ad: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Makina sınıfı adı boş olamaz'
      },
      notNull: {
        msg: 'Makina sınıfı adı gereklidir'
      },
      len: {
        args: [1, 255],
        msg: 'Makina sınıfı adı 1-255 karakter arasında olmalıdır'
      },
      is: {
        args: /^[A-Za-z0-9\sçÇğĞıİöÖşŞüÜ]+$/,
        msg: 'Makina sınıfı adı sadece harf, rakam ve boşluk içerebilir'
      }
    },
    comment: 'Makina sınıfının adı (örn: Panel Ebatlama Sınıfı)'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Açıklama en fazla 1000 karakter olabilir'
      }
    },
    comment: 'Makina sınıfı hakkında detaylı açıklama'
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Sınıfın aktif olup olmadığı'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Kayıt oluşturulma tarihi'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Kayıt güncelleme tarihi'
  }
}, {
  sequelize,
  modelName: 'MakinaSinifi',
  tableName: 'makina_siniflari',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['ad']
    },
    {
      fields: ['aktif']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeCreate: (makinaSinifi) => {
      // Adı formatla
      if (makinaSinifi.ad) {
        makinaSinifi.ad = MakinaSinifi.formatAd(makinaSinifi.ad);
      }
    },
    beforeUpdate: (makinaSinifi) => {
      // Adı formatla
      if (makinaSinifi.changed('ad')) {
        makinaSinifi.ad = MakinaSinifi.formatAd(makinaSinifi.ad);
      }
    }
  }
});

module.exports = MakinaSinifi;