const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const { v4: uuidv4 } = require('uuid');

class MakinaSiparis extends Model {
  static associate(models) {
    // Sipariş bir makina için
    MakinaSiparis.belongsTo(models.Makina, {
      foreignKey: 'makina_id',
      targetKey: 'makina_id',
      as: 'makina'
    });

    // Sipariş birden çok stok girişi oluşturabilir
    MakinaSiparis.hasMany(models.MakinaStok, {
      foreignKey: 'siparis_id',
      sourceKey: 'siparis_id',
      as: 'stoklar'
    });
  }

  /**
   * Sipariş durumuna göre renk kodu döndürür
   * @returns {string} Hex renk kodu
   */
  getDurumRengi() {
    const renkler = {
      'Beklemede': '#9E9E9E',
      'Gövde Montaj': '#2196F3',
      'Boyada': '#FF9800',
      'Son montajda': '#9C27B0',
      'Üretimde': '#FFC107',
      'Tamamlandı': '#4CAF50',
      'İptal': '#F44336'
    };
    return renkler[this.durum] || '#9E9E9E';
  }
}

MakinaSiparis.init({
  siparis_id: {
    type: DataTypes.STRING(36),
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
    field: 'siparis_id'
  },
  siparis_no: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'siparis_no',
    comment: 'Sipariş numarası (örn: SIP-2026-0001)'
  },
  makina_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'makina_id',
    comment: 'Makina UUID',
    references: {
      model: 'makinalar',
      key: 'makina_id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  musteri_adi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'musteri_adi',
    comment: 'Müşteri tam adı'
  },
  musteri_telefon: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'musteri_telefon',
    comment: 'İletişim telefonu'
  },
  musteri_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'musteri_email',
    comment: 'İletişim e-posta'
  },
  adet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'adet',
    comment: 'Sipariş adedi',
    validate: {
      min: 1
    }
  },
  durum: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Beklemede',
    field: 'durum',
    comment: 'Sipariş durumu'
  },
  siparis_tarihi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'siparis_tarihi',
    comment: 'Sipariş alma tarihi'
  },
  teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'teslim_tarihi',
    comment: 'Planlanan teslim tarihi'
  },
  tamamlanma_tarihi: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'tamamlanma_tarihi',
    comment: 'Gerçekleşen teslim tarihi'
  },
  notlar: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notlar',
    comment: 'Sipariş notları'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  sequelize,
  modelName: 'MakinaSiparis',
  tableName: 'makina_siparisleri',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['siparis_no']
    },
    {
      fields: ['makina_id']
    },
    {
      fields: ['durum']
    },
    {
      fields: ['siparis_tarihi']
    }
  ]
});

module.exports = MakinaSiparis;
