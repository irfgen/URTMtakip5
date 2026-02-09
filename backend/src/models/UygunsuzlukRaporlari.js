const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

/**
 * Uygunsuzluk Raporları Modeli
 *
 * İşletme içerisinde personeller tarafından tespit edilen uygunsuzlukların
 * kayıt altına alınması, sorumlu kişilere atanması, incelenmesi ve
 * sonuçlandırılmasını sağlayan yönetim sistemi modülü.
 *
 * @author URTM Takip
 * @version 1.0
 */
class UygunsuzlukRaporlari extends Model {
  static associate(models) {
    // Personel ilişkileri
    if (models.Personel) {
      UygunsuzlukRaporlari.belongsTo(models.Personel, {
        foreignKey: 'raporlayan_id',
        as: 'raporlayan',
        constraints: false
      });
      UygunsuzlukRaporlari.belongsTo(models.Personel, {
        foreignKey: 'sorumlu_id',
        as: 'sorumlu',
        constraints: false
      });
    }

    // Tezgah ilişkisi (opsiyonel)
    if (models.Tezgah) {
      UygunsuzlukRaporlari.belongsTo(models.Tezgah, {
        foreignKey: 'tezgah_id',
        targetKey: 'tezgah_id',
        constraints: false,
        as: 'tezgah'
      });
    }

    // İlişkili tablolar ( Güvenli kontrol )
    if (models.UygunsuzlukNotlari) {
      UygunsuzlukRaporlari.hasMany(models.UygunsuzlukNotlari, {
        foreignKey: 'rapor_id',
        as: 'notlar'
      });
    }
    if (models.UygunsuzlukTedbirleri) {
      UygunsuzlukRaporlari.hasMany(models.UygunsuzlukTedbirleri, {
        foreignKey: 'rapor_id',
        as: 'tedbirler'
      });
    }
    if (models.UygunsuzlukDosyalari) {
      UygunsuzlukRaporlari.hasMany(models.UygunsuzlukDosyalari, {
        foreignKey: 'rapor_id',
        as: 'dosyalar'
      });
    }
  }

  /**
   * Rapor numarası oluştur
   * Format: UYS-YYYY-XXXX (örn: UYS-2026-0001)
   */
  static async generateRaporNo() {
    const year = new Date().getFullYear();
    const prefix = `UYS-${year}`;

    // Bu yılın son raporunu bul
    const lastRapor = await this.findOne({
      where: {
        rapor_no: {
          [sequelize.Sequelize.Op.like]: `${prefix}%`
        }
      },
      order: [['rapor_no', 'DESC']]
    });

    let sequenceNo = 1;
    if (lastRapor) {
      const lastSequence = parseInt(lastRapor.rapor_no.split('-')[2]);
      sequenceNo = lastSequence + 1;
    }

    return `${prefix}-${String(sequenceNo).padStart(4, '0')}`;
  }

  /**
   * Özet bilgiler al
   */
  getOzet() {
    return {
      id: this.id,
      rapor_no: this.rapor_no,
      baslik: this.baslik,
      kategori: this.kategori,
      oncelik: this.oncelik,
      durum: this.durum,
      lokasyon: this.lokasyon,
      tespit_tarihi: this.tespit_tarihi,
      hedef_tarih: this.hedef_tarih,
      raporlayan: 'Belirtilmedi',
      sorumlu: null,
      kapanma_tarihi: this.kapanma_tarihi
    };
  }

  /**
   * Açık rapor mu?
   */
  isOpen() {
    return this.durum === 'acik' || this.durum === 'atandi' || this.durum === 'inceleniyor';
  }

  /**
   * Kapatılmış rapor mu?
   */
  isClosed() {
    return this.durum === 'kapatildi' || this.durum === 'iptal';
  }

  /**
   * Süresi geçmiş rapor mu?
   */
  isOverdue() {
    if (!this.hedef_tarih || this.isClosed()) return false;
    return new Date(this.hedef_tarih) < new Date();
  }
}

UygunsuzlukRaporlari.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rapor_no: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  baslik: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  aciklama: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  kategori: {
    type: DataTypes.ENUM('is_guvenligi', 'kalite', 'cevre', 'surec', 'diger'),
    allowNull: false,
    defaultValue: 'diger'
  },
  oncelik: {
    type: DataTypes.ENUM('dusuk', 'orta', 'yuksek', 'acil'),
    allowNull: false,
    defaultValue: 'orta'
  },
  lokasyon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tezgah_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  durum: {
    type: DataTypes.ENUM('acik', 'atandi', 'inceleniyor', 'cozum_bekliyor', 'cozum_surecinde', 'onay', 'tamamlandi', 'kapatildi', 'iptal'),
    allowNull: false,
    defaultValue: 'acik'
  },
  cozum_adimlari: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Çözüm adımları: [{adim: "text", tamamlandi: boolean, eklenme_tarihi: date, tamamlanma_tarihi: date}]'
  },
  raporlayan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Raporlayan personel (gelecekte eklenecek)'
  },
  sorumlu_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Sorumlu personel (gelecekte eklenecek)'
  },
  atama_tarihi: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hedef_tarih: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tespit_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  kapanma_tarihi: {
    type: DataTypes.DATE,
    allowNull: true
  },
  maliyet: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  etkinlik_puani: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  resim_yollar: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'UygunsuzlukRaporlari',
  tableName: 'uygunsuzluk_raporlari',
  timestamps: false, // Manually define timestamps instead of using auto
  underscored: false, // Global underscored ayarını override et
  // Otomatik association oluşturmayı engelle
  // raporlayan_id ve sorumlu_id alanları association değil
  indexes: [
    {
      fields: ['durum']
    },
    {
      fields: ['kategori']
    },
    {
      fields: ['oncelik']
    },
    {
      fields: ['raporlayan_id']
    },
    {
      fields: ['sorumlu_id']
    },
    {
      fields: ['tespit_tarihi']
    }
  ]
});

module.exports = UygunsuzlukRaporlari;
