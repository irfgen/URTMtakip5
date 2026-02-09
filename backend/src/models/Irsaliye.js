const { DataTypes } = require('sequelize');

/**
 * İrsaliye Model
 *
 * Expert Panel Requirements:
 * - Lock mechanism with 4-state machine (UNLOCKED, LOCKED_BY_ME, LOCKED_BY_OTHER, LOCK_EXPIRED)
 * - Lock timeout: 30 minutes (configurable)
 * - Instance methods: lock(), unlock(), isLocked(), getLockState()
 *
 * @module Irsaliye
 */
module.exports = (sequelize) => {
  const Irsaliye = sequelize.define('Irsaliye', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    irsaliye_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'İrsaliye numarası zorunludur'
        },
        notNull: {
          msg: 'İrsaliye numarası zorunludur'
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
          msg: 'Tedarikçi seçilmelidir'
        }
      }
    },
    belge_tarih: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Belge tarihi zorunludur'
        },
        isDate: {
          msg: 'Geçerli bir tarih giriniz'
        }
      }
    },
    kayit_tarih: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    belge_tipi: {
      type: DataTypes.ENUM('gelis', 'cikis'),
      allowNull: false,
      defaultValue: 'gelis',
      validate: {
        isIn: {
          args: [['gelis', 'cikis']],
          msg: 'Belge tipi "gelis" veya "cikis" olmalıdır'
        }
      }
    },
    toplam_kalem: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Kalem sayısı 0 veya daha büyük olmalıdır'
        }
      }
    },
    toplam_miktar: {
      type: DataTypes.REAL,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Miktar 0 veya daha büyük olmalıdır'
        }
      }
    },
    durum: {
      type: DataTypes.ENUM('bekliyor', 'kismi_eslesti', 'tam_eslesti'),
      allowNull: false,
      defaultValue: 'bekliyor',
      validate: {
        isIn: {
          args: [['bekliyor', 'kismi_eslesti', 'tam_eslesti']],
          msg: 'Durum "bekliyor", "kismi_eslesti" veya "tam_eslesti" olmalıdır'
        }
      }
    },
    aciklama: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    locked_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    locked_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'irsaliyeler',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['irsaliye_no']
      },
      {
        fields: ['tedarikci_id']
      },
      {
        fields: ['durum']
      },
      {
        fields: ['belge_tarih']
      },
      {
        fields: ['locked_by', 'locked_at']
      }
    ],
    hooks: {
      beforeCreate: async (irsaliye) => {
        // Set default creator if not provided
        if (!irsaliye.created_by && irsaliye.currentUserId) {
          irsaliye.created_by = irsaliye.currentUserId;
        }
      },
      afterCreate: async (irsaliye) => {
        // Log creation
        console.log(`İrsaliye oluşturuldu: ${irsaliye.irsaliye_no}`);
      }
    }
  });

  /**
   * Instance Methods
   */

  /**
   * Acquire lock for this irsaliye
   * Expert Panel: 30-minute timeout with auto-release
   *
   * @param {number} userId - User ID acquiring the lock
   * @param {number} timeoutMinutes - Lock timeout in minutes (default: 30)
   * @returns {Promise<Irsaliye>} Updated irsaliye
   * @throws {Error} LOCKED_BY_OTHER - If locked by another user
   */
  Irsaliye.prototype.lock = async function(userId, timeoutMinutes = 30) {
    const now = new Date();
    const lockTimeout = new Date(now.getTime() - timeoutMinutes * 60 * 1000);

    // Auto-release expired locks
    if (this.locked_at && this.locked_at < lockTimeout) {
      this.locked_by = null;
      this.locked_at = null;
    }

    // Check if locked by another user
    if (this.locked_by && this.locked_by !== userId) {
      const error = new Error('LOCKED_BY_OTHER');
      error.lockedBy = this.locked_by;
      error.lockedAt = this.locked_at;
      throw error;
    }

    // Acquire lock
    this.locked_by = userId;
    this.locked_at = now;
    await this.save();

    return this;
  };

  /**
   * Release lock for this irsaliye
   *
   * @param {number} userId - User ID releasing the lock
   * @returns {Promise<Irsaliye>} Updated irsaliye
   * @throws {Error} NOT_LOCK_OWNER - If user doesn't own the lock
   */
  Irsaliye.prototype.unlock = async function(userId) {
    if (this.locked_by && this.locked_by !== userId) {
      const error = new Error('NOT_LOCK_OWNER');
      error.lockOwnerId = this.locked_by;
      throw error;
    }

    this.locked_by = null;
    this.locked_at = null;
    await this.save();

    return this;
  };

  /**
   * Check if irsaliye is currently locked
   * Expert Panel: Considers 30-minute timeout
   *
   * @param {number} timeoutMinutes - Lock timeout in minutes (default: 30)
   * @returns {boolean} True if locked and not expired
   */
  Irsaliye.prototype.isLocked = function(timeoutMinutes = 30) {
    if (!this.locked_by || !this.locked_at) {
      return false;
    }

    const lockTimeout = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    return this.locked_at > lockTimeout;
  };

  /**
   * Get lock state for UI rendering
   * Expert Panel: 4-state machine
   *
   * @param {number} currentUserId - Current user ID
   * @param {number} timeoutMinutes - Lock timeout in minutes (default: 30)
   * @returns {object} Lock state object
   */
  Irsaliye.prototype.getLockState = function(currentUserId, timeoutMinutes = 30) {
    // No lock
    if (!this.locked_by || !this.locked_at) {
      return {
        state: 'UNLOCKED',
        canEdit: true
      };
    }

    const lockTimeout = new Date(this.locked_at.getTime() + timeoutMinutes * 60 * 1000);
    const now = new Date();

    // Lock expired
    if (now > lockTimeout) {
      return {
        state: 'LOCK_EXPIRED',
        canEdit: true,
        canForceUnlock: true
      };
    }

    // Locked by me
    if (this.locked_by === currentUserId) {
      return {
        state: 'LOCKED_BY_ME',
        canEdit: true,
        expiresAt: lockTimeout,
        remainingMinutes: Math.max(0, Math.ceil((lockTimeout - now) / 60000))
      };
    }

    // Locked by other
    return {
      state: 'LOCKED_BY_OTHER',
      canEdit: false,
      lockedBy: this.locked_by,
      lockedAt: this.locked_at,
      expiresAt: lockTimeout,
      canRequestUnlock: true
    };
  };

  /**
   * Calculate eslesme durumunu
   *
   * @returns {Promise<string>} Calculated durum
   */
  Irsaliye.prototype.hesaplaDurum = async function() {
    const IrsaliyeKalem = sequelize.models.IrsaliyeKalem;

    const kalemler = await IrsaliyeKalem.findAll({
      where: { irsaliye_id: this.id }
    });

    if (kalemler.length === 0) {
      return 'bekliyor';
    }

    const eslesenSayi = kalemler.filter(k => k.eslesme_durumu === 1).length;

    if (eslesenSayi === 0) {
      return 'bekliyor';
    } else if (eslesenSayi < kalemler.length) {
      return 'kismi_eslesti';
    } else {
      return 'tam_eslesti';
    }
  };

  /**
   * Class Methods
   */

  /**
   * Find bekleyen irsaliyeler by tedarikci
   * Expert Panel: Optimized query with composite index
   *
   * @param {number} tedarikciId - Tedarikçi ID
   * @returns {Promise<Array>} Bekleyen irsaliyeler
   */
  Irsaliye.bekleyenlerByTedarikci = function(tedarikciId) {
    const IrsaliyeKalem = sequelize.models.IrsaliyeKalem;

    return this.findAll({
      where: {
        tedarikci_id: tedarikciId,
        durum: ['bekliyor', 'kismi_eslesti']
      },
      include: [{
        model: IrsaliyeKalem,
        as: 'kalemler',
        where: { eslesme_durumu: 0 },
        required: false
      }],
      order: [['belge_tarih', 'DESC']]
    });
  };

  /**
   * Search irsaliyeler
   *
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results with pagination
   */
  Irsaliye.arama = function(options = {}) {
    const { page = 1, limit = 20, tedarikci_id, durum, baslangic_tarih, bitis_tarih, search } = options;
    const offset = (page - 1) * limit;

    const where = {};

    if (tedarikci_id) {
      where.tedarikci_id = tedarikci_id;
    }

    if (durum) {
      where.durum = durum;
    }

    if (baslangic_tarih || bitis_tarih) {
      where.belge_tarih = {};
      if (baslangic_tarih) {
        where.belge_tarih[sequelize.Op.gte] = baslangic_tarih;
      }
      if (bitis_tarih) {
        where.belge_tarih[sequelize.Op.lte] = bitis_tarih;
      }
    }

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { irsaliye_no: { [Op.iLike]: `%${search}%` } }
      ];
    }

    return this.findAndCountAll({
      where,
      include: ['tedarikci', 'olusturan', 'kilitli_kullanici'],
      limit,
      offset,
      order: [['belge_tarih', 'DESC']],
      distinct: true
    }).then(result => ({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.count,
        totalPages: Math.ceil(result.count / limit)
      }
    }));
  };

  /**
   * Model Associations
   */
  Irsaliye.associate = (models) => {
    // Tedarikçi ilişkisi
    if (models.Firma) {
      Irsaliye.belongsTo(models.Firma, {
        foreignKey: 'tedarikci_id',
        as: 'tedarikci'
      });
    }

    // Personel ilişkileri (User yerine Personel kullanıyoruz)
    if (models.Personel) {
      Irsaliye.belongsTo(models.Personel, {
        foreignKey: 'created_by',
        as: 'olusturan'
      });

      Irsaliye.belongsTo(models.Personel, {
        foreignKey: 'locked_by',
        as: 'kilitli_kullanici'
      });
    }

    // Kalemler ilişkisi
    if (models.IrsaliyeKalem) {
      Irsaliye.hasMany(models.IrsaliyeKalem, {
        foreignKey: 'irsaliye_id',
        as: 'kalemler'
      });
    }
  };

  return Irsaliye;
};
