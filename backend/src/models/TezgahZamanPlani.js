const { Model, DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database').sequelize;

class TezgahZamanPlani extends Model {
  static associate(models) {
    // Tezgah ilişkisi
    TezgahZamanPlani.belongsTo(models.Tezgah, {
      foreignKey: 'tezgah_id',
      as: 'tezgah'
    });

    // İş emri ilişkisi  
    TezgahZamanPlani.belongsTo(models.IsEmri, {
      foreignKey: 'is_emri_id',
      as: 'isEmri'
    });
  }

  // Helper methods
  static async findConflicts(tezgahId, baslangicZamani, bitisZamani, excludeId = null) {
    const whereCondition = {
      tezgah_id: tezgahId,
      durum: ['planli', 'devam_ediyor'], // Sadece aktif planları kontrol et
      [Op.or]: [
        // Yeni iş mevcut işin içinde başlıyor
        {
          baslangic_zamani: {
            [Op.lte]: baslangicZamani
          },
          bitis_zamani: {
            [Op.gt]: baslangicZamani
          }
        },
        // Yeni iş mevcut işin içinde bitiyor
        {
          baslangic_zamani: {
            [Op.lt]: bitisZamani
          },
          bitis_zamani: {
            [Op.gte]: bitisZamani
          }
        },
        // Yeni iş mevcut işi tamamen kapsıyor
        {
          baslangic_zamani: {
            [Op.gte]: baslangicZamani
          },
          bitis_zamani: {
            [Op.lte]: bitisZamani
          }
        },
        // Mevcut iş yeni işi tamamen kapsıyor
        {
          baslangic_zamani: {
            [Op.lte]: baslangicZamani
          },
          bitis_zamani: {
            [Op.gte]: bitisZamani
          }
        }
      ]
    };

    if (excludeId) {
      whereCondition.id = { [Op.ne]: excludeId };
    }

    return await TezgahZamanPlani.findAll({
      where: whereCondition,
      include: [
        {
          model: sequelize.models.IsEmri,
          as: 'isEmri',
          attributes: ['is_emri_no', 'is_adi']
        }
      ]
    });
  }

  // Süre hesaplama helper'ı
  calculateActualDuration() {
    if (!this.baslangic_zamani || !this.bitis_zamani) return 0;
    const start = new Date(this.baslangic_zamani);
    const end = new Date(this.bitis_zamani);
    return Math.round((end - start) / (1000 * 60)); // dakika cinsinden
  }

  // Durum güncellemeleri için helper
  async updateStatus(newStatus, notes = null) {
    const updateData = { 
      durum: newStatus,
      guncelleme_tarihi: new Date()
    };
    
    if (notes) {
      updateData.notlar = notes;
    }

    // Eğer iş başlatılıyorsa gerçek başlangıç zamanını kaydet
    if (newStatus === 'devam_ediyor' && this.durum === 'planli') {
      updateData.gercek_baslangic = new Date();
    }

    // Eğer iş tamamlanıyorsa gerçek süreyi hesapla
    if (newStatus === 'tamamlandi') {
      const gercekBaslangic = this.gercek_baslangic || this.baslangic_zamani;
      const now = new Date();
      updateData.gerceklesen_sure_dakika = Math.round((now - new Date(gercekBaslangic)) / (1000 * 60));
    }

    await this.update(updateData);
    return this;
  }

  // JSON serileştirme için
  toSchedulerFormat() {
    return {
      id: this.id,
      taskId: `scheduler_task_${this.id}`,
      workstationId: this.tezgah_id,
      workOrderId: this.is_emri_id,
      startTime: this.baslangic_zamani,
      endTime: this.bitis_zamani,
      plannedDuration: this.planlanan_sure_dakika,
      actualDuration: this.gerceklesen_sure_dakika,
      status: this.durum,
      priority: this.oncelik,
      notes: this.notlar,
      workOrder: this.isEmri ? {
        id: this.isEmri.is_emri_id,
        number: this.isEmri.is_emri_no,
        name: this.isEmri.is_adi,
        partCode: this.isEmri.parca_kodu,
        quantity: this.isEmri.adet,
        status: this.isEmri.durum
      } : null,
      workstation: this.tezgah ? {
        id: this.tezgah.tezgah_id,
        name: this.tezgah.tezgah_tanimi,
        status: this.tezgah.calisma_durumu
      } : null
    };
  }
}

TezgahZamanPlani.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  tezgah_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Tezgah ID gereklidir'
      },
      isInt: {
        msg: 'Tezgah ID sayı olmalıdır'
      }
    }
  },
  is_emri_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'İş emri ID gereklidir'
      },
      isInt: {
        msg: 'İş emri ID sayı olmalıdır'
      }
    }
  },
  baslangic_zamani: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Başlangıç zamanı gereklidir'
      },
      isDate: {
        msg: 'Geçerli bir tarih giriniz'
      }
    }
  },
  bitis_zamani: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Bitiş zamanı gereklidir'
      },
      isDate: {
        msg: 'Geçerli bir tarih giriniz'
      },
      isAfterStart(value) {
        if (value <= this.baslangic_zamani) {
          throw new Error('Bitiş zamanı başlangıç zamanından sonra olmalıdır');
        }
      }
    }
  },
  planlanan_sure_dakika: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 480, // 8 saat
    validate: {
      min: {
        args: [1],
        msg: 'Planlanan süre en az 1 dakika olmalıdır'
      },
      max: {
        args: [2880], // 48 saat
        msg: 'Planlanan süre maksimum 48 saat olabilir'
      }
    }
  },
  gerceklesen_sure_dakika: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Gerçekleşen süre negatif olamaz'
      }
    }
  },
  durum: {
    type: DataTypes.ENUM('planli', 'devam_ediyor', 'tamamlandi', 'ertelendi', 'iptal'),
    defaultValue: 'planli',
    allowNull: false,
    validate: {
      isIn: {
        args: [['planli', 'devam_ediyor', 'tamamlandi', 'ertelendi', 'iptal']],
        msg: 'Geçersiz durum değeri'
      }
    }
  },
  oncelik: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: {
        args: [1],
        msg: 'Öncelik 1-4 arasında olmalıdır'
      },
      max: {
        args: [4],
        msg: 'Öncelik 1-4 arasında olmalıdır'
      }
    }
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gercek_baslangic: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Gerçek başlangıç zamanı (iş başlatıldığında kaydedilir)'
  },
  olusturma_tarihi: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'TezgahZamanPlani',
  tableName: 'tezgah_zaman_plani',
  timestamps: false, // Manuel timestamp yönetimi yapıyoruz
  hooks: {
    beforeUpdate: (instance, options) => {
      instance.guncelleme_tarihi = new Date();
    }
  },
  indexes: [
    // Performans için önemli index'ler migration'da tanımlandı
    { fields: ['tezgah_id'] },
    { fields: ['is_emri_id'] },
    { fields: ['durum'] },
    { fields: ['baslangic_zamani', 'bitis_zamani'] },
    { fields: ['tezgah_id', 'baslangic_zamani', 'bitis_zamani'] }
  ]
});

module.exports = TezgahZamanPlani;