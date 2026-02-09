const { DataTypes } = require('sequelize');

/**
 * Fatura Model
 *
 * Expert Panel Requirements:
 * - Lock mechanism with 4-state machine (same as Irsaliye)
 * - Lock timeout: 30 minutes (configurable)
 * - Price fields: birim_fiyat, toplam_tutar (recording only, no processing)
 *
 * @module Fatura
 */
module.exports = (sequelize) => {
  const Fatura = sequelize.define('Fatura', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fatura_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Fatura numarası zorunludur'
        },
        notNull: {
          msg: 'Fatura numarası zorunludur'
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
    vade_tarih: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Geçerli bir vade tarihi giriniz'
        }
      }
    },
    kayit_tarih: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
    ara_toplam: {
      type: DataTypes.REAL,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Ara toplam 0 veya daha büyük olmalıdır'
        }
      },
      comment: 'Tutar bilgisi (sadece kaydetme)'
    },
    kdv: {
      type: DataTypes.REAL,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'KDV 0 veya daha büyük olmalıdır'
        }
      }
    },
    genel_toplam: {
      type: DataTypes.REAL,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Genel toplam 0 veya daha büyük olmalıdır'
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
    },
    belge_dosya_yolu: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        is: {
          args: [/^(https?:\/\/|\/).+\.(pdf|jpg|jpeg|png)$/i],
          msg: 'Dosya yolu geçerli formatta olmalıdır'
        }
      }
    }
  }, {
    tableName: 'faturalar',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['fatura_no']
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
      },
      {
        fields: ['vade_tarih']
      }
    ],
    hooks: {
      beforeCreate: async (fatura) => {
        // Set default creator if not provided
        if (!fatura.created_by && fatura.currentUserId) {
          fatura.created_by = fatura.currentUserId;
        }

        // Calculate totals if kalemler provided
        if (fatura.kalemler && fatura.kalemler.length > 0) {
          let araToplam = 0;
          let kdv = 0;

          fatura.kalemler.forEach(kalem => {
            araToplam += (kalem.miktar * kalem.birim_fiyat) || 0;
          });

          // KDV hesaplama (örnek: %20)
          kdv = araToplam * 0.20;

          fatura.ara_toplam = araToplam;
          fatura.kdv = kdv;
          fatura.genel_toplam = araToplam + kdv;
        }
      },
      afterCreate: async (fatura) => {
        // Log creation
        console.log(`Fatura oluşturuldu: ${fatura.fatura_no}`);
      }
    }
  });

  /**
   * Instance Methods
   */

  /**
   * Acquire lock for this fatura
   * Expert Panel: 30-minute timeout with auto-release
   *
   * @param {number} userId - User ID acquiring the lock
   * @param {number} timeoutMinutes - Lock timeout in minutes (default: 30)
   * @returns {Promise<Fatura>} Updated fatura
   * @throws {Error} LOCKED_BY_OTHER - If locked by another user
   */
  Fatura.prototype.lock = async function(userId, timeoutMinutes = 30) {
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
   * Release lock for this fatura
   *
   * @param {number} userId - User ID releasing the lock
   * @returns {Promise<Fatura>} Updated fatura
   * @throws {Error} NOT_LOCK_OWNER - If user doesn't own the lock
   */
  Fatura.prototype.unlock = async function(userId) {
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
   * Check if fatura is currently locked
   * Expert Panel: Considers 30-minute timeout
   *
   * @param {number} timeoutMinutes - Lock timeout in minutes (default: 30)
   * @returns {boolean} True if locked and not expired
   */
  Fatura.prototype.isLocked = function(timeoutMinutes = 30) {
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
  Fatura.prototype.getLockState = function(currentUserId, timeoutMinutes = 30) {
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
  Fatura.prototype.hesaplaDurum = async function() {
    const FaturaKalem = sequelize.models.FaturaKalem;

    const kalemler = await FaturaKalem.findAll({
      where: { fatura_id: this.id }
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
   * Find bekleyen faturalar by tedarikci
   * Expert Panel: Optimized query
   *
   * @param {number} tedarikciId - Tedarikçi ID
   * @returns {Promise<Array>} Bekleyen faturalar
   */
  Fatura.bekleyenlerByTedarikci = function(tedarikciId) {
    const FaturaKalem = sequelize.models.FaturaKalem;

    return this.findAll({
      where: {
        tedarikci_id: tedarikciId,
        durum: ['bekliyor', 'kismi_eslesti']
      },
      include: [{
        model: FaturaKalem,
        as: 'kalemler',
        where: { eslesme_durumu: 0 },
        required: false
      }],
      order: [['belge_tarih', 'DESC']]
    });
  };

  /**
   * Search faturalar
   *
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results with pagination
   */
  Fatura.arama = function(options = {}) {
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
        { fatura_no: { [Op.iLike]: `%${search}%` } }
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
  Fatura.associate = (models) => {
    // Tedarikçi ilişkisi
    if (models.Firma) {
      Fatura.belongsTo(models.Firma, {
        foreignKey: 'tedarikci_id',
        as: 'tedarikci'
      });
    }

    // Personel ilişkileri (User yerine Personel kullanıyoruz)
    if (models.Personel) {
      Fatura.belongsTo(models.Personel, {
        foreignKey: 'created_by',
        as: 'olusturan'
      });

      Fatura.belongsTo(models.Personel, {
        foreignKey: 'locked_by',
        as: 'kilitli_kullanici'
      });
    }

    // Kalemler ilişkisi
    if (models.FaturaKalem) {
      Fatura.hasMany(models.FaturaKalem, {
        foreignKey: 'fatura_id',
        as: 'kalemler'
      });
    }
  };

  return Fatura;
};
