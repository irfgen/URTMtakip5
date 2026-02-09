const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class TedarikDetay extends Model {
  static associate(models) {
    // TedarikDetay belongs to TedarikTalebi
    TedarikDetay.belongsTo(models.TedarikTalebi, {
      foreignKey: 'talep_id',
      as: 'talep'
    });

    // TedarikDetay belongs to StokKarti
    TedarikDetay.belongsTo(models.StokKarti, {
      foreignKey: 'stok_karti_id',
      as: 'stokKarti',
      constraints: false // Foreign key constraint'ini devre dışı bırak
    });
  }

  // Instance metodları

  /**
   * Satır toplamını hesaplar
   * @returns {number} Satır toplamı
   */
  getSatirToplami() {
    const miktar = parseFloat(this.miktar) || 0;
    const birimFiyat = parseFloat(this.birim_fiyat) || 0;
    return miktar * birimFiyat;
  }

  /**
   * Formatlanmış satır toplamı
   * @returns {string} Formatlanmış tutar
   */
  getFormattedSatirToplami() {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(this.getSatirToplami());
  }

  /**
   * Formatlanmış miktar
   * @returns {string} Formatlanmış miktar
   */
  getFormattedMiktar() {
    const miktar = parseFloat(this.miktar) || 0;
    return miktar.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ' + (this.birim || '');
  }

  // Class metodları

  /**
   * Talep detaylarını talep ID'sine göre getirir
   * @param {number} talepId Talep ID
   * @returns {Promise<TedarikDetay[]>} Detay listesi
   */
  static async findByTalepId(talepId) {
    return await this.findAll({
      where: { talep_id: talepId },
      include: [
        {
          model: require('./StokKarti'),
          as: 'stokKarti'
        }
      ],
      order: [['id', 'ASC']]
    });
  }

  /**
   * Talep detaylarının toplam tutarını hesaplar
   * @param {number} talepId Talep ID
   * @returns {Promise<number>} Toplam tutar
   */
  static async calculateToplamTutar(talepId) {
    const detaylar = await this.findAll({
      where: { talep_id: talepId },
      attributes: ['miktar', 'birim_fiyat']
    });

    return detaylar.reduce((toplam, detay) => {
      const miktar = parseFloat(detay.miktar) || 0;
      const birimFiyat = parseFloat(detay.birim_fiyat) || 0;
      return toplam + (miktar * birimFiyat);
    }, 0);
  }

  /**
   * Talep detaylarını günceller ve toplam tutarı hesaplar
   * @param {number} talepId Talep ID
   * @param {Array} detaylar Detay listesi
   * @returns {Promise<TedarikDetay[]>} Güncellenmiş detaylar
   */
  static async updateDetaylar(talepId, detaylar) {
    const transaction = await sequelize.transaction();

    try {
      // Mevcut detayları sil
      await this.destroy({
        where: { talep_id: talepId },
        transaction
      });

      // Yeni detayları oluştur
      const yeniDetaylar = await this.bulkCreate(
        detaylar.map(detay => ({
          ...detay,
          talep_id: talepId
        })),
        { transaction }
      );

      // Talep toplam tutarını güncelle
      const toplamTutar = await this.calculateToplamTutar(talepId);
      await require('./TedarikTalebi').update(
        { toplam_tutar: toplamTutar },
        { where: { id: talepId }, transaction }
      );

      await transaction.commit();
      return yeniDetaylar;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

// Model tanımı
TedarikDetay.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  talep_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tedarik_talepleri',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Tedarik talebi ID'
  },
  malzeme_adi: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Malzeme adı boş olamaz'
      },
      len: {
        args: [1, 200],
        msg: 'Malzeme adı 1-200 karakter arasında olmalı'
      }
    },
    comment: 'Malzeme adı'
  },
  malzeme_kodu: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Malzeme kodu'
  },
  miktar: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Miktar boş olamaz'
      },
      min: {
        args: [0.01],
        msg: 'Miktar 0\'dan büyük olmalı'
      }
    },
    comment: 'Miktar'
  },
  birim: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'adet',
    comment: 'Birim (kg, adet, metrekare vb)'
  },
  birim_fiyat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Birim fiyat 0 veya pozitif olmalı'
      }
    },
    comment: 'Birim fiyat'
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Satır açıklaması'
  },
  stok_karti_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'İlişkili stok kartı ID'
  },
  teknik_ozellikler: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Teknik özellikler ve spesifikasyonlar'
  },
  termin_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Termin tarihi'
  },
  karsilanan_miktar: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Karşılanan miktar 0 veya pozitif olmalı'
      }
    },
    comment: 'Karşılanan teslimat miktarı'
  }
}, {
  sequelize,
  modelName: 'TedarikDetay',
  tableName: 'tedarik_detaylari',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeSave: (detay) => {
      // Boş birim fiyatı 0 olarak ayarla
      if (detay.birim_fiyat === null || detay.birim_fiyat === '') {
        detay.birim_fiyat = 0;
      }

      // Boş karşılanan miktarı 0 olarak ayarla
      if (detay.karsilanan_miktar === null || detay.karsilanan_miktar === '') {
        detay.karsilanan_miktar = 0;
      }
    },
    afterCreate: async (detay) => {
      // Talep toplam tutarını güncelle
      try {
        const toplamTutar = await this.calculateToplamTutar(detay.talep_id);
        await require('./TedarikTalebi').update(
          { toplam_tutar: toplamTutar },
          { where: { id: detay.talep_id } }
        );
      } catch (error) {
        console.error('Talep toplam tutarı güncellenirken hata:', error);
      }
    },
    afterUpdate: async (detay) => {
      // Talep toplam tutarını güncelle
      try {
        const toplamTutar = await this.calculateToplamTutar(detay.talep_id);
        await require('./TedarikTalebi').update(
          { toplam_tutar: toplamTutar },
          { where: { id: detay.talep_id } }
        );
      } catch (error) {
        console.error('Talep toplam tutarı güncellenirken hata:', error);
      }
    }
  }
});

module.exports = TedarikDetay;